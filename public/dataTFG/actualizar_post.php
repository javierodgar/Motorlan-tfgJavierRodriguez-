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

function is_absolute_url($url) {
    return (bool)preg_match('#^[a-z]+://#i', $url);
}

if (isset($_GET['id']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $publicacion_id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_NUMBER_INT);

    if ($publicacion_id) {
        $titulo = filter_input(INPUT_POST, 'titulo', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $texto = filter_input(INPUT_POST, 'texto', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $hashtags_string = filter_input(INPUT_POST, 'hashtags', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $imagen_existente = filter_input(INPUT_POST, 'imagen_existente', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $nombre_imagen = $imagen_existente; 

        $pdo->beginTransaction();

        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = UPLOAD_DIR; 
            $nombre_temporal = $_FILES['imagen']['tmp_name'];
            $nombre_archivo = basename($_FILES['imagen']['name']);
            $nueva_nombre_imagen = $uploadDir . $nombre_archivo; 

            $tipos_permitidos = ['image/jpeg', 'image/png', 'image/gif'];
            if (in_array($_FILES['imagen']['type'], $tipos_permitidos) && $_FILES['imagen']['size'] < 2000000) {
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                if (move_uploaded_file($nombre_temporal, $nueva_nombre_imagen)) {
                    $nombre_imagen =  $nueva_nombre_imagen; 
                    if ($imagen_existente && !is_absolute_url($imagen_existente) && file_exists($imagen_existente) && strpos($imagen_existente, 'uploads/') !== false) {
                        unlink($imagen_existente);
                    }
                } else {
                    $pdo->rollBack();
                    echo json_encode(['error' => 'Error al guardar la nueva imagen.']);
                    http_response_code(500);
                    exit;
                }
            } else {
                $pdo->rollBack();
                echo json_encode(['error' => 'Formato de archivo no válido o demasiado grande.']);
                http_response_code(400);
                exit;
            }
        } else {
            if ($imagen_existente) {
                if (!is_absolute_url($imagen_existente)) {
                    $nombre_imagen =  ltrim($imagen_existente, '/');
                }
            } else {
                $nombre_imagen = null; 
            }
        }

        try {
            $stmt_update_post = $pdo->prepare("UPDATE Publicaciones SET titulo = :titulo, imagen = :imagen, texto = :texto WHERE id = :id");
            $stmt_update_post->bindParam(':id', $publicacion_id, PDO::PARAM_INT);
            $stmt_update_post->bindParam(':titulo', $titulo, PDO::PARAM_STR);
            $stmt_update_post->bindParam(':imagen', $nombre_imagen, PDO::PARAM_STR); // Usar la URL completa
            $stmt_update_post->bindParam(':texto', $texto, PDO::PARAM_STR);

            if (!$stmt_update_post->execute()) {
                $pdo->rollBack();
                echo json_encode(['error' => 'Error al actualizar la publicación.']);
                http_response_code(500);
                exit;
            }

            $stmt_delete_relations = $pdo->prepare("DELETE FROM PublicacionHashtag WHERE publicacion_id = :publicacion_id");
            $stmt_delete_relations->bindParam(':publicacion_id', $publicacion_id, PDO::PARAM_INT);
            $stmt_delete_relations->execute();

            if (!empty($hashtags_string)) {
                $hashtags_array = array_map('trim', explode(',', $hashtags_string));

                foreach ($hashtags_array as $hashtag) {
                    if (!empty($hashtag)) {
                        $stmt_check_hashtag = $pdo->prepare("SELECT id FROM Hashtags WHERE nombre = :hashtag");
                        $stmt_check_hashtag->bindParam(":hashtag", $hashtag);
                        $stmt_check_hashtag->execute();
                        $result_hashtag = $stmt_check_hashtag->fetch(PDO::FETCH_ASSOC);

                        if ($result_hashtag) {
                            $hashtag_id = $result_hashtag['id'];
                        } else {
                            $stmt_insert_hashtag = $pdo->prepare("INSERT INTO Hashtags (nombre) VALUES (:hashtag)");
                            $stmt_insert_hashtag->bindParam(":hashtag", $hashtag);
                            if ($stmt_insert_hashtag->execute()) {
                                $hashtag_id = $pdo->lastInsertId();
                            } else {
                                $pdo->rollBack();
                                http_response_code(500);
                                echo json_encode(["message" => "Error al insertar un nuevo hashtag: " . $stmt_insert_hashtag->errorInfo()[2]]);
                                exit;
                            }
                        }

                        $stmt_insert_relation = $pdo->prepare("INSERT INTO PublicacionHashtag (publicacion_id, hashtag_id) VALUES (:publicacion_id, :hashtag_id)");
                        $stmt_insert_relation->bindParam(":publicacion_id", $publicacion_id, PDO::PARAM_INT);
                        $stmt_insert_relation->bindParam(":hashtag_id", $hashtag_id, PDO::PARAM_INT);
                        if (!$stmt_insert_relation->execute()) {
                            $pdo->rollBack();
                            http_response_code(500);
                            echo json_encode(["message" => "Error al crear la relación publicación-hashtag: " . $stmt_insert_relation->errorInfo()[2]]);
                            exit;
                        }
                    }
                }
            }

            $pdo->commit();
            echo json_encode(['mensaje' => 'Publicación actualizada con éxito.']);

        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['error' => 'Error al actualizar la base de datos: ' . $e->getMessage()]);
            http_response_code(500);
        }

    } else {
        echo json_encode(['error' => 'ID de publicación no válido.']);
        http_response_code(400);
    }
} else {
    echo json_encode(['error' => 'Se requiere el ID de la publicación y datos por método POST.']);
    http_response_code(400);
}

?>