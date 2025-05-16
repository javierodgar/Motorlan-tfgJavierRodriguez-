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

$follower = $data->follower;
$followed = $data->followed;

try {
    $checkQuery = "SELECT 1 FROM seguidores WHERE seguidor = :seguidor AND seguido = :seguido";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(":seguidor", $follower);
    $checkStmt->bindParam(":seguido", $followed);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        $deleteQuery = "DELETE FROM seguidores WHERE seguidor = :seguidor AND seguido = :seguido";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(":seguidor", $follower);
        $deleteStmt->bindParam(":seguido", $followed);
        if ($deleteStmt->execute()) {
            echo json_encode(["message" => "Dejaste de seguir a " . $followed]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al dejar de seguir."]);
        }
    } else {
        $insertQuery = "INSERT INTO seguidores (seguidor, seguido) VALUES (:seguidor, :seguido)";
        $insertStmt = $pdo->prepare($insertQuery);
        $insertStmt->bindParam(":seguidor", $follower);
        $insertStmt->bindParam(":seguido", $followed);
        if ($insertStmt->execute()) {
            echo json_encode(["message" => "Comenzaste a seguir a " . $followed]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al seguir."]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en la base de datos: " . $e->getMessage()]);
}
?>