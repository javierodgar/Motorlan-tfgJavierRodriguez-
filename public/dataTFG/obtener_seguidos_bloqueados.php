<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->usuario)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el nombre de usuario para obtener la información."]);
        exit;
    }

    $nombreUsuario = filter_var($data->usuario, FILTER_SANITIZE_STRING);

    $queryUsuarioId = "SELECT id FROM Usuarios WHERE usuario = :usuario";
    $stmtUsuarioId = $pdo->prepare($queryUsuarioId);
    $stmtUsuarioId->bindParam(":usuario", $nombreUsuario, PDO::PARAM_STR);
    $stmtUsuarioId->execute();
    $usuarioInfo = $stmtUsuarioId->fetch(PDO::FETCH_ASSOC);

    if (!$usuarioInfo) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
        exit;
    }

    $usuarioId = $usuarioInfo['id'];

    $querySiguiendo = "SELECT u.usuario, u.profile_image, u.id FROM Seguidores s
                                JOIN Usuarios u ON s.seguido = u.usuario
                                WHERE s.seguidor = :usuario";
    $stmtSiguiendo = $pdo->prepare($querySiguiendo);
    $stmtSiguiendo->bindParam(":usuario", $nombreUsuario, PDO::PARAM_STR);
    $stmtSiguiendo->execute();
    $siguiendo = $stmtSiguiendo->fetchAll(PDO::FETCH_ASSOC);

    foreach ($siguiendo as &$seguido) {
        $seguido['profile_image'] = BASE_URL .  $seguido['profile_image'];
    }

    $queryBloqueados = "SELECT u.usuario, u.profile_image, u.id FROM Bloqueos b
                                    JOIN Usuarios u ON b.usuario_bloqueado = u.id
                                    WHERE b.usuario_bloqueador = :usuario_id";
    $stmtBloqueados = $pdo->prepare($queryBloqueados);
    $stmtBloqueados->bindParam(":usuario_id", $usuarioId, PDO::PARAM_INT);
    $stmtBloqueados->execute();
    $bloqueados = $stmtBloqueados->fetchAll(PDO::FETCH_ASSOC);

    foreach ($bloqueados as &$bloqueado) {
        $bloqueado['profile_image'] = BASE_URL .  $bloqueado['profile_image'];
    }

    http_response_code(200);
    echo json_encode(["relaciones" => ["siguiendo" => $siguiendo, "bloqueados" => $bloqueados]]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>