<?php
header("Access-Control-Allow-Origin: *"); // Cambia "*" por tu dominio si es necesario
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

if (empty($data->evento_id) || empty($data->usuario_id)) {
    http_response_code(400);
    echo json_encode(["message" => "Se requiere el ID del evento y el ID del usuario."]);
    exit;
}

$evento_id = $data->evento_id;
$usuario_id = $data->usuario_id;

try {
    $query = "DELETE FROM InscripcionesEventos WHERE evento_id = :evento_id AND usuario_id = :usuario_id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Inscrito eliminado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al eliminar el inscrito."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>