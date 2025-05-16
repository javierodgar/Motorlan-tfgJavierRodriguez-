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
    $username_searching = isset($_GET['user']) ? trim($_GET['user']) : null;
    $results = [];
    $user_id_searching = null;

    if ($username_searching !== null) {
        $stmt_get_id = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :username");
        $stmt_get_id->bindValue(':username', $username_searching, PDO::PARAM_STR);
        $stmt_get_id->execute();
        $row_id = $stmt_get_id->fetch(PDO::FETCH_ASSOC);
        if ($row_id) {
            $user_id_searching = $row_id['id'];
        }
    }

    $sql = "SELECT id, usuario, profile_image FROM Usuarios WHERE usuario LIKE :term";

    if ($user_id_searching) {
        $sql .= " AND id NOT IN (
            SELECT b.usuario_bloqueador
            FROM Bloqueos b
            WHERE b.usuario_bloqueado = :usuario_logueado_id
        )";
    }

    $stmt_user = $pdo->prepare($sql);
    $stmt_user->bindValue(':term', '%' . $term . '%', PDO::PARAM_STR);

    if ($user_id_searching) {
        $stmt_user->bindValue(':usuario_logueado_id', $user_id_searching, PDO::PARAM_INT);
    }

    $stmt_user->execute();
    while ($row = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
        $results[] = ['tipo' => 'usuario', 'id' => $row['id'], 'nombre_usuario' => $row['usuario'], 'profile_image' => BASE_URL  . $row['profile_image']];
    }

    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>