<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'db_connection.php'; 

try {
    $json_data = file_get_contents("php://input");
    $data = json_decode($json_data, true);

    if (isset($data['id']) && isset($data['titulo']) && isset($data['texto'])) {
        $post_id = filter_var($data['id'], FILTER_SANITIZE_NUMBER_INT);
        $titulo = filter_var($data['titulo'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $texto = filter_var($data['texto'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $imagen = isset($data['imagen']) ? filter_var($data['imagen'], FILTER_SANITIZE_URL) : null;
        $hashtags_str = isset($data['hashtags']) ? filter_var($data['hashtags'], FILTER_SANITIZE_FULL_SPECIAL_CHARS) : null;

        $pdo->beginTransaction();

        try {
            $stmt_post = $pdo->prepare("UPDATE Publicaciones SET titulo = :titulo, texto = :texto, imagen = :imagen WHERE id = :id");
            $stmt_post->bindParam(':id', $post_id, PDO::PARAM_INT);
            $stmt_post->bindParam(':titulo', $titulo, PDO::PARAM_STR);
            $stmt_post->bindParam(':texto', $texto, PDO::PARAM_STR);
            if ($imagen) {
                $imagen = BASE_URL . ltrim($imagen, '/');
            }
            $stmt_post->bindParam(':imagen', $imagen, PDO::PARAM_STR);

            if (!$stmt_post->execute()) {
                throw new Exception("Error al actualizar la publicación.");
            }

            $stmt_delete_hashtags = $pdo->prepare("DELETE FROM PublicacionHashtag WHERE publicacion_id = :post_id");
            $stmt_delete_hashtags->bindParam(':post_id', $post_id, PDO::PARAM_INT);
            $stmt_delete_hashtags->execute();

            if ($hashtags_str) {
                $hashtags_array = array_map('trim', explode(' ', $hashtags_str));
                foreach ($hashtags_array as $hashtag_nombre) {
                    if (!empty($hashtag_nombre)) {
                        $stmt_check_hashtag = $pdo->prepare("SELECT id FROM Hashtags WHERE nombre = :nombre");
                        $stmt_check_hashtag->bindParam(':nombre', $hashtag_nombre, PDO::PARAM_STR);
                        $stmt_check_hashtag->execute();
                        $hashtag_row = $stmt_check_hashtag->fetch(PDO::FETCH_ASSOC);

                        if ($hashtag_row) {
                            $hashtag_id = $hashtag_row['id'];
                        } else {
                            $stmt_insert_hashtag = $pdo->prepare("INSERT INTO Hashtags (nombre) VALUES (:nombre)");
                            $stmt_insert_hashtag->bindParam(':nombre', $hashtag_nombre, PDO::PARAM_STR);
                            $stmt_insert_hashtag->execute();
                            $hashtag_id = $pdo->lastInsertId();
                        }

                        $stmt_insert_relation = $pdo->prepare("INSERT INTO PublicacionHashtag (publicacion_id, hashtag_id) VALUES (:post_id, :hashtag_id)");
                        $stmt_insert_relation->bindParam(':post_id', $post_id, PDO::PARAM_INT);
                        $stmt_insert_relation->bindParam(':hashtag_id', $hashtag_id, PDO::PARAM_INT);
                        $stmt_insert_relation->execute();
                    }
                }
            }
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(array('error' => 'Error al actualizar el post y los hashtags: ' . $e->getMessage()));
            exit; 
        }

        $pdo->commit();
        echo json_encode(array('message' => 'Post actualizado con éxito.'));
        exit; 

    } else {
        echo json_encode(array('error' => 'Datos incompletos para la actualización del post.'));
        exit; 
    }
} catch (PDOException $e) {
    echo json_encode(array('error' => 'Error de conexión a la base de datos: ' . $e->getMessage()));
    exit; 
} catch (Exception $e) {
    echo json_encode(array('error' => 'Error general: ' . $e->getMessage()));
    exit; 
} finally {
    if ($pdo) {
        $pdo = null;
    }
}
?>
