<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db_config.php'; 

try {
    
    $evento_id = isset($_GET['evento_id']) ? $_GET['evento_id'] : null;

    if ($evento_id === null) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el ID del evento."]);
        exit;
    }

    
    $query = "SELECT u.id AS usuario_id, u.dni as usuario_dni, u.usuario AS username, ie.fecha_inscripcion, u.valoracion_global as valoracion
              FROM InscripcionesEventos ie
              INNER JOIN Usuarios u ON ie.usuario_id = u.id
              WHERE ie.evento_id = :evento_id";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmt->execute();

    $inscritos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $inscritos[] = $row;
    }

    http_response_code(200);
    echo json_encode($inscritos);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>