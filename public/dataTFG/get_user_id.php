<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; 
}

require_once 'db_config.php';

try {
    if (isset($_GET['username'])) {
        $username = $_GET['username'];

        $query = "SELECT id FROM Usuarios WHERE usuario = :username";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode(['id' => $row['id']]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Usuario no encontrado.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'Se requiere el parámetro "username".']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>