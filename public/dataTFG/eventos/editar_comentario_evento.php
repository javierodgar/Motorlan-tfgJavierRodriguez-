<?php


header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS, PUT");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once '../db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->evento_id) || !is_numeric($data->evento_id) || empty($data->comentario_id) || !is_numeric($data->comentario_id) || empty($data->nuevo_texto)) {
    http_response_code(400);
    echo json_encode(["message" => "ID de evento, ID de comentario o texto inválido."]);
    exit;
}

$evento_id = $data->evento_id;
$comentario_id = $data->comentario_id;
$nuevo_texto = htmlspecialchars(strip_tags($data->nuevo_texto)); // Sanear el texto

try {
    $stmtCheck = $pdo->prepare("SELECT usuario_id FROM ComentariosEventos WHERE id = :comentario_id AND evento_id = :evento_id");
    $stmtCheck->bindParam(":comentario_id", $comentario_id, PDO::PARAM_INT);
    $stmtCheck->bindParam(":evento_id", $evento_id, PDO::PARAM_INT);
    $stmtCheck->execute();
    $commentData = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$commentData) {
        http_response_code(404);
        echo json_encode(["message" => "Comentario no encontrado para este evento."]);
        exit;
    }


    $stmt = $pdo->prepare("UPDATE ComentariosEventos SET texto = :texto WHERE id = :comentario_id AND evento_id = :evento_id");
    $stmt->bindParam(":comentario_id", $comentario_id, PDO::PARAM_INT);
    $stmt->bindParam(":evento_id", $evento_id, PDO::PARAM_INT);
    $stmt->bindParam(":texto", $nuevo_texto, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Comentario editado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al editar el comentario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>