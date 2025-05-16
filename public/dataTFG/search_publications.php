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
    $sortBy = isset($_GET['sortBy']) ? trim($_GET['sortBy']) : 'default';
    $results = [];

    $sql = "SELECT p.id, p.titulo, p.texto,
                   (SELECT COUNT(*) FROM LikesDislikes ld WHERE ld.publicacion_id = p.id AND ld.tipo = 'like') AS likes_count,
                   (SELECT COUNT(*) FROM LikesDislikes ld WHERE ld.publicacion_id = p.id AND ld.tipo = 'dislike') AS dislikes_count
            FROM Publicaciones p
            WHERE p.titulo LIKE :term OR p.texto LIKE :term";

    switch ($sortBy) {
        case 'likes':
            $sql .= " ORDER BY likes_count DESC";
            break;
        case 'dislikes':
            $sql .= " ORDER BY dislikes_count DESC";
            break;
        default:
            $sql .= " ORDER BY p.id DESC"; 
            break;
    }

    $stmt_pub = $pdo->prepare($sql);
    $stmt_pub->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);
    $stmt_pub->execute();

    while ($row = $stmt_pub->fetch(PDO::FETCH_ASSOC)) {
        $results[] = [
            'tipo' => 'publicacion',
            'id' => $row['id'],
            'titulo' => $row['titulo'],
            'texto' => $row['texto'],
            'likes_count' => $row['likes_count'],
            'dislikes_count' => $row['dislikes_count']
        ];
    }

    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>