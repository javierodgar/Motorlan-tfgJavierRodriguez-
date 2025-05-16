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

    if (empty($data->usuario_seguidor) || empty($data->usuario_a_dejar_de_seguir)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el nombre del usuario seguidor y del usuario a dejar de seguir."]);
        exit;
    }

    $usuarioSeguidorNombre = filter_var($data->usuario_seguidor, FILTER_SANITIZE_STRING);
    $usuarioADejarDeSeguirNombre = filter_var($data->usuario_a_dejar_de_seguir, FILTER_SANITIZE_STRING);

    $queryEliminarSeguimiento = "DELETE FROM Seguidores
                                WHERE seguidor = :usuario_seguidor
                                  AND seguido = :usuario_a_seguir";
    $stmtEliminarSeguimiento = $pdo->prepare($queryEliminarSeguimiento);
    $stmtEliminarSeguimiento->bindParam(":usuario_seguidor", $usuarioSeguidorNombre, PDO::PARAM_STR);
    $stmtEliminarSeguimiento->bindParam(":usuario_a_seguir", $usuarioADejarDeSeguirNombre, PDO::PARAM_STR);

    if ($stmtEliminarSeguimiento->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Dejaste de seguir al usuario con éxito."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al dejar de seguir al usuario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>