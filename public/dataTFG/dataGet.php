<?php

header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Origin: http://localhost:4200"); 

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 
header("Access-Control-Max-Age: 86400"); 
header("Access-Control-Allow-Headers: *"); 
header("Access-Control-Expose-Headers: *"); 

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit; 
}

require_once 'db_config.php';

if ($data === null) {
    http_response_code(400); 
    echo json_encode(["message" => "Error: No se recibieron datos válidos en formato JSON"]);
    exit;
}

$username = $data['username'] ?? null;

if (empty($username)) {
    http_response_code(400); 
    echo json_encode(["message" => "Error: Debes proporcionar un nombre de usuario"]);
    exit;
}

try {

    $stmt = $pdo->prepare("SELECT usuario, contrasena, cof FROM Usuarios WHERE usuario = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        http_response_code(200); 
        echo json_encode([
            "message" => "Usuario encontrado",
            "data" => [
                "username" => $result['usuario'],
                "encryptedPassword" => $result['contrasena'],
                "cof" => $result['cof']
            ]
        ]);
    } else {
        http_response_code(404); 
        echo json_encode(["message" => "Error: No se encontró un usuario con ese nombre"]);
    }

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>