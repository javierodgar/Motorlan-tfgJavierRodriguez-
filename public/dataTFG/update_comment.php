<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit; 
}
require_once 'db_config.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->publicacion_id) || empty($data->comentario_id) || empty($data->nuevo_texto)) {
        http_response_code(400);
        echo json_encode(["message" => "Datos incompletos para actualizar el comentario."]);
        exit;
    }

    $publicacionId = intval($data->publicacion_id);
    $comentarioId = intval($data->comentario_id);
    $nuevoTexto = htmlspecialchars(trim($data->nuevo_texto));

    
    $query = "UPDATE comentarios
              SET texto = :nuevo_texto
              WHERE id = :comentario_id AND publicacion_id = :publicacion_id";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":nuevo_texto", $nuevoTexto, PDO::PARAM_STR);
    $stmt->bindParam(":comentario_id", $comentarioId, PDO::PARAM_INT);
    $stmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Comentario actualizado exitosamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontró el comentario con el ID proporcionado para esta publicación o no se realizaron cambios."]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar el comentario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>