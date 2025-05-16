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
    $queryId = "SELECT id FROM Usuarios WHERE usuario = :username";
    $stmtId = $pdo->prepare($queryId);
    $stmtId->bindParam(":username", $data->follower);
    $stmtId->execute();

    $followerId = $stmtId->fetch(PDO::FETCH_ASSOC)["id"];

    $queryId = "SELECT id FROM Usuarios WHERE usuario = :username";
    $stmtId = $pdo->prepare($queryId);
    $stmtId->bindParam(":username", $data->followed);
    $stmtId->execute();

    $followedId = $stmtId->fetch(PDO::FETCH_ASSOC)["id"];

    $query = "SELECT 1 FROM bloqueos WHERE usuario_bloqueador = :seguidor AND usuario_bloqueado = :seguido";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":seguidor",$followerId);
    $stmt->bindParam(":seguido", $followedId);
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