<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; 
}

require_once 'db_config.php';

$username = $_POST["usuario"] ?? null;
$title = $_POST["titulo"] ?? null;
$text = $_POST["texto"] ?? null;
$hashtags_string = $_POST["hashtags"] ?? null;

$image = null;
if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] === UPLOAD_ERR_OK) {
    $uploadDir = UPLOAD_DIR; 
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $imageName = uniqid() . "_" . basename($_FILES["imagen"]["name"]); 
    $imagePath = $uploadDir . $imageName; 

    if (!move_uploaded_file($_FILES["imagen"]["tmp_name"], $imagePath)) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen"]);
        exit;
    }

    $image = $uploadDir . $imageName;
}

if (empty($username) || empty($title) || empty($text)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Faltan datos obligatorios (usuario, título o texto)"]);
    exit;
}

try {
    
    $stmt_publicacion = $pdo->prepare("INSERT INTO Publicaciones (usuario, imagen, titulo, texto, fecha_creacion) VALUES (:usuario, :imagen, :titulo, :texto, NOW())");
    $stmt_publicacion->bindParam(":usuario", $username);
    $stmt_publicacion->bindParam(":imagen", $image);
    $stmt_publicacion->bindParam(":titulo", $title);
    $stmt_publicacion->bindParam(":texto", $text);

    if ($stmt_publicacion->execute()) {
        $publicacion_id = $pdo->lastInsertId();

        
        if (!empty($hashtags_string)) {
            $hashtags_array = array_map('trim', explode(',', $hashtags_string));

            foreach ($hashtags_array as $hashtag) {
                if (!empty($hashtag)) {
                    
                    $stmt_check_hashtag = $pdo->prepare("SELECT id FROM Hashtags WHERE LOWER(nombre) = LOWER(:hashtag)");
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
                            http_response_code(500);
                            echo json_encode(["message" => "Error al insertar un nuevo hashtag: " . $stmt_insert_hashtag->errorInfo()[2]]);
                            exit;
                        }
                    }

                   
                    $stmt_insert_relation = $pdo->prepare("INSERT INTO PublicacionHashtag (publicacion_id, hashtag_id) VALUES (:publicacion_id, :hashtag_id)");
                    $stmt_insert_relation->bindParam(":publicacion_id", $publicacion_id, PDO::PARAM_INT);
                    $stmt_insert_relation->bindParam(":hashtag_id", $hashtag_id, PDO::PARAM_INT);
                    if (!$stmt_insert_relation->execute()) {
                        http_response_code(500);
                        echo json_encode(["message" => "Error al crear la relación publicación-hashtag: " . $stmt_insert_relation->errorInfo()[2]]);
                        exit;
                    }
                }
            }
        }

        http_response_code(201); 
        echo json_encode(["message" => "Publicación creada exitosamente"]);

    } else {
        http_response_code(500); 
        echo json_encode(["message" => "Error al crear la publicación: " . $stmt_publicacion->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
} finally {
    
    $pdo = null;
}
?>