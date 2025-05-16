<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php'; 

try {
    $term = isset($_GET['term']) ? trim($_GET['term']) : '';
    $results = [];

    $sql = "SELECT
                e.id,
                e.titulo,
                e.descripcion,
                e.direccion,
                e.fecha_inicio,
                e.fecha_fin,
                (SELECT COUNT(*) FROM LikesDislikesEventos lde WHERE lde.evento_id = e.id AND lde.tipo = 'like') AS likes_count,
                (SELECT COUNT(*) FROM ComentariosEventos ce WHERE ce.evento_id = e.id) AS comentarios_count
            FROM Eventos e
            WHERE e.titulo LIKE :term OR e.descripcion LIKE :term OR e.direccion LIKE :term";

    $stmt_events = $pdo->prepare($sql);
    $stmt_events->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);
    $stmt_events->execute();

    while ($row = $stmt_events->fetch(PDO::FETCH_ASSOC)) {
        $results[] = [
            'tipo' => 'evento',
            'id' => $row['id'],
            'titulo' => $row['titulo'],
            'descripcion' => $row['descripcion'],
            'direccion' => $row['direccion'],
            'fecha_inicio' => $row['fecha_inicio'],
            'fecha_fin' => $row['fecha_fin'],
            'likes_count' => $row['likes_count'],
            'comentarios_count' => $row['comentarios_count']
        ];
    }

    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos al buscar eventos: " . $e->getMessage()]);
}
?>