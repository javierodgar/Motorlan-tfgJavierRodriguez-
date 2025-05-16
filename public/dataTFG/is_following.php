<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit; 
}
require_once 'db_config.php'; 

$data = json_decode(file_get_contents("php://input"));

if (empty($data->follower) || empty($data->followed)) {
    http_response_code(400);
    echo json_encode(["message" => "Faltan datos del seguidor o del seguido."]);
    exit();
}

try {
    $query = "SELECT 1 FROM seguidores WHERE seguidor = :seguidor AND seguido = :seguido";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":seguidor", $data->follower);
    $stmt->bindParam(":seguido", $data->followed);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(["is_following" => true]);
    } else {
        echo json_encode(["is_following" => false]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en la base de datos: " . $e->getMessage()]);
}
?>