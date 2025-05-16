<?php
// backend/get_valoracion_global.php

// **Incluir configuración de la base de datos**
require_once '../db_config.php';

// La conexión PDO ($pdo) ya está disponible desde db_config.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

try {
    $username = isset($_GET['username']) ? $_GET['username'] : '';

    if (empty($username)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el nombre de usuario."]);
        exit;
    }

    $query = "SELECT valoracion_global FROM Usuarios WHERE usuario = :username";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":username", $username, PDO::PARAM_STR);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        http_response_code(200);
        echo json_encode(["valoracion_global" => floatval($row['valoracion_global'])]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>