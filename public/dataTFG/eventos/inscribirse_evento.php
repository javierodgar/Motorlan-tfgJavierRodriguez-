<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit;
}

require_once '../db_config.php'; 

try {
    $data = json_decode(file_get_contents("php://input"));

    $evento_id = isset($data->evento_id) ? filter_var($data->evento_id, FILTER_SANITIZE_NUMBER_INT) : null;
    $username = isset($data->username) ? filter_var($data->username, FILTER_SANITIZE_STRING) : null;

    if (empty($evento_id) || $evento_id <= 0 || empty($username)) {
        http_response_code(400);
        echo json_encode(["message" => "Datos de inscripción no válidos."]);
        exit;
    }

    // Obtener el ID del usuario basado en el username
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

    // Verificar si el usuario ya está inscrito en el evento
    $check_query = "SELECT * FROM InscripcionesEventos WHERE evento_id = :evento_id AND usuario_id = :usuario_id";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $check_stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["message" => "Ya estás inscrito en este evento."]);
        exit;
    }

    // Insertar la inscripción
    $insert_query = "INSERT INTO InscripcionesEventos (evento_id, usuario_id) VALUES (:evento_id, :usuario_id)";
    $insert_stmt = $pdo->prepare($insert_query);
    $insert_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $insert_stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);

    if ($insert_stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Inscripción exitosa."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al inscribirse: " . $insert_stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>