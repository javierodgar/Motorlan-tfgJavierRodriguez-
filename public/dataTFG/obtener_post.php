<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once 'db_config.php';

// Define tu variable PHP que quieres añadir al inicio de la ruta de la imagen
$rutaBaseImagenes = BASE_URL ; // Asumiendo que tus imágenes están en la carpeta 'uploads' relativa a BASE_URL

if (isset($_GET['id'])) {
    $publicacionId = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_NUMBER_INT);
    if ($publicacionId) {
        try {
            $stmt_post = $pdo->prepare("SELECT id, usuario, imagen, titulo, texto, fecha_creacion FROM Publicaciones WHERE id = :id");
            $stmt_post->bindParam(':id', $publicacionId, PDO::PARAM_INT);
            $stmt_post->execute();
            $publicacion = $stmt_post->fetch(PDO::FETCH_ASSOC);

            if ($publicacion) {
                // Concatenar la variable al inicio de la ruta de la imagen
                $publicacion['imagen'] = BASE_URL . $publicacion['imagen'];

                $queryHashtags = "SELECT h.nombre
                                    FROM Hashtags h
                                    INNER JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
                                    WHERE ph.publicacion_id = :publicacion_id";
                $stmtHashtags = $pdo->prepare($queryHashtags);
                $stmtHashtags->bindParam(':publicacion_id', $publicacionId, PDO::PARAM_INT);
                $stmtHashtags->execute();
                $hashtagsResult = $stmtHashtags->fetchAll(PDO::FETCH_COLUMN);
                $publicacion['hashtags'] = $hashtagsResult;

                echo json_encode($publicacion);
            } else {
                echo json_encode(['mensaje' => 'No se encontró la publicación con el ID proporcionado.']);
                http_response_code(404);
            }
        } catch(PDOException $e) {
            echo json_encode(['error' => 'Error al consultar la base de datos: ' . $e->getMessage()]);
            http_response_code(500);
        }
    } else {
        echo json_encode(['error' => 'ID de publicación no válido.']);
        http_response_code(400);
    }
} else {
    echo json_encode(['error' => 'Se requiere el ID de la publicación.']);
    http_response_code(400);
}
?>