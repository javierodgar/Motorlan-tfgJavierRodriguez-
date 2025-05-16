<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

require_once '../db_config.php'; 

try {
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

    
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare("SELECT evt.id, evt.titulo, evt.descripcion, evt.categoria, evt.imagen_portada, evt.direccion, evt.fecha_creacion, evt.fecha_inicio, evt.fecha_fin, evt.usuario_creador_id, evt.estado_id, e.nombre FROM Eventos as evt
    inner join estadosevento e on e.id = evt.estado_id
    where evt.estado_id = 1 or evt.estado_id = 2
    order by fecha_creacion desc
    LIMIT :limit OFFSET :offset;");
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($eventos);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener los eventos: " . $e->getMessage()]);
}
?>