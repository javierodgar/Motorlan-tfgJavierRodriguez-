<?php


header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db_config.php'; 

try {
    if (!isset($_POST['id']) || !is_numeric($_POST['id']) || intval($_POST['id']) <= 0) {
        echo json_encode(array('error' => 'Se requiere un ID de post válido para la edición.'));
        exit();
    }

    $post_id = filter_var($_POST['id'], FILTER_SANITIZE_NUMBER_INT);
    $titulo = filter_var($_POST['titulo'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $texto = filter_var($_POST['texto'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $hashtags_str = isset($_POST['hashtags']) ? filter_var($_POST['hashtags'], FILTER_SANITIZE_FULL_SPECIAL_CHARS) : null;
    $imagen_existente = isset($_POST['imagen_existente']) ? filter_var($_POST['imagen_existente'], FILTER_SANITIZE_URL) : null;
    $nombre_imagen = null;

    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $archivo_temporal = $_FILES['imagen']['tmp_name'];
        $nombre_archivo = basename($_FILES['imagen']['name']);
        $extension = strtolower(pathinfo($nombre_archivo, PATHINFO_EXTENSION));

        $extensiones_permitidas = array("jpg", "jpeg", "png", "gif");
        if (in_array($extension, $extensiones_permitidas)) {
            $nombre_imagen = uniqid('post_') . '.' . $extension;
            $ruta_destino = 'ruta/a/tu/directorio/de/imagenes/' . $nombre_imagen; 
            if (!move_uploaded_file($archivo_temporal, $ruta_destino)) {
                throw new Exception("Error al guardar la nueva imagen.");
            }
        } else {
            throw new Exception("Formato de imagen no permitido.");
        }
    } else if ($imagen_existente) {
        $nombre_imagen = basename($imagen_existente);
    } else {
        
    }

    $pdo->beginTransaction();

    try {
       
        $stmt_post = $pdo->prepare("UPDATE Publicaciones SET titulo = :titulo, texto = :texto, imagen = :imagen WHERE id = :id");
        $stmt_post->bindParam(':id', $post_id, PDO::PARAM_INT);
        $stmt_post->bindParam(':titulo', $titulo, PDO::PARAM_STR);
        $stmt_post->bindParam(':texto', $texto, PDO::PARAM_STR);
        $stmt_post->bindParam(':imagen', $nombre_imagen, PDO::PARAM_STR);
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

        $pdo->commit();
        echo json_encode(array('message' => 'Post actualizado con éxito.'));

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(array('error' => 'Error al actualizar el post: ' . $e->getMessage()));
    }

} catch (PDOException $e) {
    echo json_encode(array('error' => 'Error de conexión a la base de datos: ' . $e->getMessage()));
}
?>