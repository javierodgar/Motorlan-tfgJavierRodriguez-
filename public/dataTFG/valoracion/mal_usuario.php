<?php
// backend/valoracion/mal_usuario.php

// **Incluir configuración de la base de datos**
require_once '../db_config.php';

// La conexión PDO ($pdo) ya está disponible desde db_config.php

// Configuración de cabeceras para solicitudes CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejar solicitudes preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit;
}
try {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->username)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el nombre de usuario."]);
        exit;
    }

    $username = $data->username;
    $decremento = -0.1;

    $query = "select valoracion_global from Usuarios where usuario = :username";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":username", $username, PDO::PARAM_STR);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $valoracion_global = $row['valoracion_global'];

    if ($valoracion_global <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "El usuario ya tiene una valoración de 1."]);
        exit;
    }

    $query = "UPDATE Usuarios SET valoracion_global = valoracion_global + :decremento WHERE usuario = :username";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":decremento", $decremento, PDO::PARAM_STR);
    $stmt->bindParam(":username", $username, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Usuario marcado como mal usuario. Valoración decrementada."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar la valoración."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>