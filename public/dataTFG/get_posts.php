<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

try {
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $usuario_logueado = isset($_GET['usuario_logueado']) ? $_GET['usuario_logueado'] : null;
    $offset = ($page - 1) * $limit;
    $usuario_logueado_id = null;
    if ($usuario_logueado) {
        $stmt_usuario_logueado = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :usuario_logueado");
        $stmt_usuario_logueado->bindParam(':usuario_logueado', $usuario_logueado, PDO::PARAM_STR);
        $stmt_usuario_logueado->execute();
        $resultado_usuario_logueado = $stmt_usuario_logueado->fetch(PDO::FETCH_ASSOC);
        if ($resultado_usuario_logueado) {
            $usuario_logueado_id = $resultado_usuario_logueado['id'];
        }
    }
    $sql = "SELECT
                p.id,
                p.usuario,
                p.imagen,
                p.titulo,
                p.texto,
                (SELECT COUNT(*) FROM LikesDislikes ld WHERE ld.publicacion_id = p.id AND ld.tipo = 'like') AS likes_count,
                (SELECT COUNT(*) FROM LikesDislikes ld WHERE ld.publicacion_id = p.id AND ld.tipo = 'dislike') AS dislikes_count
            FROM Publicaciones p";
    if ($usuario_logueado_id) {
        $sql .= " WHERE p.usuario NOT IN (
                    SELECT u.usuario FROM Usuarios u
                    INNER JOIN Bloqueos b ON u.id = b.usuario_bloqueador
                    WHERE b.usuario_bloqueado = :usuario_logueado_id
                )";
    }
    $sql .= " ORDER BY p.fecha_creacion DESC
                LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    if ($usuario_logueado_id) {
        $stmt->bindParam(':usuario_logueado_id', $usuario_logueado_id, PDO::PARAM_INT);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $postsResult = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $posts = [];
    foreach ($postsResult as $row) {
        $post_id = $row["id"];
        $hashtags_stmt = $pdo->prepare("
            SELECT
                h.nombre
            FROM Hashtags h
            INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
            WHERE ph.publicacion_id = :post_id
        ");
        $hashtags_stmt->bindParam(":post_id", $post_id, PDO::PARAM_INT);
        $hashtags_stmt->execute();
        $hashtagsResult = $hashtags_stmt->fetchAll(PDO::FETCH_COLUMN);

        $posts[] = [
            "id" => $row["id"],
            "usuario" => $row["usuario"],
            "imagen" => BASE_URL  . $row["imagen"],
            "titulo" => $row["titulo"],
            "texto" => $row["texto"],
            "hashtags" => $hashtagsResult,
            "likes_count" => $row["likes_count"],
            "dislikes_count" => $row["dislikes_count"]
        ];
    }

    http_response_code(200);
    echo json_encode(["message" => "Publicaciones obtenidas", "data" => $posts]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>