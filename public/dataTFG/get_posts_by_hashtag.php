<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit;
}

require_once 'db_config.php'; 


try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['hashtag'])) {
        $hashtag = $pdo->quote($data['hashtag']);

        $sql_posts = "SELECT
                            p.id,
                            p.usuario,
                            p.imagen,
                            p.titulo,
                            p.texto,
                            p.fecha_creacion,
                            'publicacion' AS tipo,
                            (SELECT COUNT(*) FROM LikesDislikes WHERE publicacion_id = p.id AND tipo = 'like') AS total_likes,
                            (SELECT COUNT(*) FROM LikesDislikes WHERE publicacion_id = p.id AND tipo = 'dislike') AS total_dislikes
                        FROM Publicaciones p
                        INNER JOIN PublicacionHashtag ph ON p.id = ph.publicacion_id
                        INNER JOIN Hashtags h ON ph.hashtag_id = h.id
                        WHERE h.nombre = $hashtag
                        ORDER BY p.fecha_creacion DESC";

        $stmt_posts = $pdo->query($sql_posts);
        $posts = $stmt_posts->fetchAll(PDO::FETCH_ASSOC);

        $results = array();

        foreach ($posts as $post) {
            $publicacion_id = $post['id'];
            $post['imagen'] = BASE_URL .  $post['imagen'];
            $sql_hashtags = "SELECT
                                    h.nombre
                                FROM PublicacionHashtag ph
                                INNER JOIN Hashtags h ON ph.hashtag_id = h.id
                                WHERE ph.publicacion_id = :publicacion_id";

            $stmt_hashtags = $pdo->prepare($sql_hashtags);
            $stmt_hashtags->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            $stmt_hashtags->execute();
            $hashtags = $stmt_hashtags->fetchAll(PDO::FETCH_COLUMN);

            $post['hashtags'] = $hashtags;
            $results[] = $post;
        }

        echo json_encode($results);

    } else {
        echo json_encode(array('error' => 'No se proporcionó el hashtag.'));
        http_response_code(400);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array('error' => 'Error de base de datos: ' . $e->getMessage()));
}
?>