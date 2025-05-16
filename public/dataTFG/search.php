<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With"); 


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // OK
    exit; 
}

require_once 'db_config.php';

try {
    $term = isset($_GET['term']) ? trim($_GET['term']) : '';
    $filters_json = isset($_GET['filters']) ? $_GET['filters'] : '[]';
    $filters = json_decode($filters_json, true);

    $results = [];

    if (!empty($term)) {
        if (in_array('publicaciones', $filters) || empty($filters)) {
            $stmt_pub = $pdo->prepare("SELECT id, titulo, texto FROM Publicaciones WHERE titulo LIKE :term");
            $stmt_pub->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);
            $stmt_pub->execute();
            while ($row = $stmt_pub->fetch(PDO::FETCH_ASSOC)) {
                $results[] = ['tipo' => 'publicacion', 'id' => $row['id'], 'titulo' => $row['titulo'], 'texto' => $row['texto']];
            }
        }

        if (in_array('hashtags', $filters) || empty($filters)) {
            $stmt_hash = $pdo->prepare("SELECT h.nombre, COUNT(ph.publicacion_id) AS conteo
                                        FROM Hashtags h
                                        LEFT JOIN PublicacionHashtag ph ON h.id = ph.hashtag_id
                                        LEFT JOIN Publicaciones p ON ph.publicacion_id = p.id
                                        WHERE h.nombre LIKE :term
                                        GROUP BY h.nombre
                                        ORDER BY conteo DESC");
            $stmt_hash->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);
            $stmt_hash->execute();
            while ($row = $stmt_hash->fetch(PDO::FETCH_ASSOC)) {
                $results[] = ['tipo' => 'hashtag', 'nombre' => $row['nombre'], 'conteo' => $row['conteo']];
            }
        }

        if (in_array('usuarios', $filters) || empty($filters)) {
            $stmt_user = $pdo->prepare("SELECT id, usuario FROM Usuarios WHERE usuario LIKE :term");
            $stmt_user->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);
            $stmt_user->execute();
            while ($row = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
                $results[] = ['tipo' => 'usuario', 'id' => $row['id'], 'nombre_usuario' => $row['usuario']];
            }
        }
    } elseif (empty($term) && empty($filters)) {
        
    } elseif (empty($term) && !empty($filters)) {
        
        if (in_array('usuarios', $filters)) {
            $stmt_all_users = $pdo->prepare("SELECT id, usuario FROM Usuarios");
            $stmt_all_users->execute();
            while ($row = $stmt_all_users->fetch(PDO::FETCH_ASSOC)) {
                $results[] = ['tipo' => 'usuario', 'id' => $row['id'], 'nombre_usuario' => $row['usuario']];
            }
        }
        
    }

    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>