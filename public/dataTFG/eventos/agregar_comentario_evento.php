<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->evento_id) || empty($data->usuario_id) || empty($data->texto)) {
    http_response_code(400);
    echo json_encode(["message" => "Se requieren el ID del evento, el ID del usuario y el texto del comentario."]);
    exit;
}

$evento_id = intval($data->evento_id);
$usuario_id = intval($data->usuario_id);
$texto = htmlspecialchars(trim($data->texto)); 

try {
    $query = "INSERT INTO ComentariosEventos (evento_id, usuario_id, texto) VALUES (:evento_id, :usuario_id, :texto)";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
    $stmt->bindParam(':texto', $texto, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Comentario agregado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al agregar el comentario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en la base de datos: " . $e->getMessage()]);
}
?>