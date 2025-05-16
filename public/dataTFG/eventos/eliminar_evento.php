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

if (empty($data->evento_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Se requiere el ID del evento."]);
    exit;
}

$evento_id = $data->evento_id;

try {
    $pdo->beginTransaction();

    $queryInscripciones = "DELETE FROM InscripcionesEventos WHERE evento_id = :evento_id";
    $stmtInscripciones = $pdo->prepare($queryInscripciones);
    $stmtInscripciones->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtInscripciones->execute();

    $queryLikes = "DELETE FROM LikesDislikesEventos WHERE evento_id = :evento_id";
    $stmtLikes = $pdo->prepare($queryLikes);
    $stmtLikes->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtLikes->execute();

    $queryComentarios = "DELETE FROM ComentariosEventos WHERE evento_id = :evento_id";
    $stmtComentarios = $pdo->prepare($queryComentarios);
    $stmtComentarios->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtComentarios->execute();

    $queryEvento = "DELETE FROM Eventos WHERE id = :evento_id";
    $stmtEvento = $pdo->prepare($queryEvento);
    $stmtEvento->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmtEvento->execute();

    $pdo->commit();

    http_response_code(200);
    echo json_encode(["message" => "Evento y sus datos asociados eliminados exitosamente."]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Error al eliminar el evento y sus datos: " . $e->getMessage()]);
}
?>