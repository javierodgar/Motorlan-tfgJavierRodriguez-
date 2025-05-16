<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Permite todos los métodos comunes

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit; 
}
require_once 'db_config.php';


try {
    
    $publicacionId = isset($_GET['publicacion_id']) ? intval($_GET['publicacion_id']) : null;

    if ($publicacionId === null || $publicacionId <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere un ID de publicación válido."]);
        exit;
    }

    
    $query = "SELECT
                    COUNT(CASE WHEN tipo = 'like' THEN 1 END) AS total_likes,
                    COUNT(CASE WHEN tipo = 'dislike' THEN 1 END) AS total_dislikes
                 FROM
                    likesdislikes
                 WHERE
                    publicacion_id = :publicacion_id";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        http_response_code(200);
        echo json_encode($result);
    } else {
        http_response_code(200);
        echo json_encode(["total_likes" => 0, "total_dislikes" => 0]); 
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>