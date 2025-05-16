<?php
// Archivo: delete_comment.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; 
}

require_once 'db_config.php';


try {
    $comentarioId = isset($_GET['comentario_id']) ? intval($_GET['comentario_id']) : null;

    if ($comentarioId === null || $comentarioId <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere un ID de comentario válido."]);
        exit;
    }

    $query = "DELETE FROM comentarios WHERE id = :comentario_id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":comentario_id", $comentarioId, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Comentario eliminado exitosamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontró el comentario con el ID proporcionado."]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al eliminar el comentario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>