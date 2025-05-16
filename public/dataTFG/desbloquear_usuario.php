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

    if (empty($data->usuario_bloqueador) || empty($data->usuario_a_desbloquear)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el nombre del usuario bloqueador y del usuario a desbloquear."]);
        exit;
    }

    $usuarioBloqueadorNombre = filter_var($data->usuario_bloqueador, FILTER_SANITIZE_STRING);
    $usuarioADesbloquearNombre = filter_var($data->usuario_a_desbloquear, FILTER_SANITIZE_STRING);

    $queryBloqueadorId = "SELECT id FROM Usuarios WHERE usuario = :usuario";
    $stmtBloqueadorId = $pdo->prepare($queryBloqueadorId);
    $stmtBloqueadorId->bindParam(":usuario", $usuarioBloqueadorNombre, PDO::PARAM_STR);
    $stmtBloqueadorId->execute();
    $bloqueadorInfo = $stmtBloqueadorId->fetch(PDO::FETCH_ASSOC);

    if (!$bloqueadorInfo) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario bloqueador no encontrado."]);
        exit;
    }

    $usuarioBloqueadorId = $bloqueadorInfo['id'];

    $queryDesbloquearId = "SELECT id FROM Usuarios WHERE usuario = :usuario";
    $stmtDesbloquearId = $pdo->prepare($queryDesbloquearId);
    $stmtDesbloquearId->bindParam(":usuario", $usuarioADesbloquearNombre, PDO::PARAM_STR);
    $stmtDesbloquearId->execute();
    $desbloquearInfo = $stmtDesbloquearId->fetch(PDO::FETCH_ASSOC);

    if (!$desbloquearInfo) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario a desbloquear no encontrado."]);
        exit;
    }

    $usuarioADesbloquearId = $desbloquearInfo['id'];

   
    $queryEliminarBloqueo = "DELETE FROM Bloqueos
                              WHERE usuario_bloqueador = :usuario_bloqueador_id
                                AND usuario_bloqueado = :usuario_a_desbloquear_id";
    $stmtEliminarBloqueo = $pdo->prepare($queryEliminarBloqueo);
    $stmtEliminarBloqueo->bindParam(":usuario_bloqueador_id", $usuarioBloqueadorId, PDO::PARAM_INT);
    $stmtEliminarBloqueo->bindParam(":usuario_a_desbloquear_id", $usuarioADesbloquearId, PDO::PARAM_INT);

    if ($stmtEliminarBloqueo->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Usuario desbloqueado con éxito."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al desbloquear el usuario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>