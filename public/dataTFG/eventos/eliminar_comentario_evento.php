<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db_config.php';

$comentario_id = $_GET['comentario_id'] ?? null;

try {
    if (empty($comentario_id) || !is_numeric($comentario_id)) {
        http_response_code(400);
        echo json_encode(["message" => "ID de comentario inválido."]);
        exit;
    }

    $stmtCheck = $pdo->prepare("SELECT id FROM ComentariosEventos WHERE id = :comentario_id");
    $stmtCheck->bindParam(":comentario_id", $comentario_id, PDO::PARAM_INT);
    $stmtCheck->execute();


    $stmt = $pdo->prepare("DELETE FROM ComentariosEventos WHERE id = :comentario_id");
    $stmt->bindParam(":comentario_id", $comentario_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Comentario borrado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al borrar el comentario."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>