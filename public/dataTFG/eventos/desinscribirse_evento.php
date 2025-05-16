<?php
// desinscribirse_evento.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit;
}

require_once '../db_config.php'; 

try {
    $data = json_decode(file_get_contents("php://input"));

    $evento_id = isset($data->evento_id) ? filter_var($data->evento_id, FILTER_SANITIZE_NUMBER_INT) : null;
    $username = isset($data->username) ? filter_var($data->username, FILTER_SANITIZE_STRING) : null;

    if (empty($evento_id) || $evento_id <= 0 || empty($username)) {
        http_response_code(400);
        echo json_encode(["message" => "Datos de desinscripción no válidos."]);
        exit;
    }

    $user_id_query = "SELECT id FROM Usuarios WHERE usuario = :username";
    $user_id_stmt = $pdo->prepare($user_id_query);
    $user_id_stmt->bindParam(':username', $username);
    $user_id_stmt->execute();
    $user = $user_id_stmt->fetch(PDO::FETCH_ASSOC);
    $usuario_id = $user ? $user['id'] : null;

    if (!$usuario_id) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
        exit;
    }

    $delete_query = "DELETE FROM InscripcionesEventos WHERE evento_id = :evento_id AND usuario_id = :usuario_id";
    $delete_stmt = $pdo->prepare($delete_query);
    $delete_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $delete_stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);

    if ($delete_stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Desinscripción exitosa."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al desinscribirse: " . $delete_stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>