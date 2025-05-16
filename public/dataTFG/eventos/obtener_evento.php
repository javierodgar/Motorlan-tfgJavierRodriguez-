<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db_config.php';

try {
    $evento_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_SANITIZE_NUMBER_INT) : null;
    $username = isset($_GET['username']) ? filter_var($_GET['username'], FILTER_SANITIZE_STRING) : 'asd';

    if (empty($evento_id) || $evento_id <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "ID de evento no válido."]);
        exit;
    }

    $user_id_query = "SELECT id FROM Usuarios WHERE usuario = :username";
    $user_id_stmt = $pdo->prepare($user_id_query);
    $user_id_stmt->bindParam(':username', $username);
    $user_id_stmt->execute();
    $user = $user_id_stmt->fetch(PDO::FETCH_ASSOC);
    $usuario_logueado_id = $user ? $user['id'] : null;

    $query = "SELECT
                        e.id,
                        e.titulo,
                        e.descripcion,
                        e.categoria,
                        e.imagen_portada,
                        e.direccion,
                        e.fecha_inicio,
                        e.fecha_fin,
                        e.usuario_creador_id,
                        ST_X(e.coordenadas) AS latitud,
                        ST_Y(e.coordenadas) AS longitud,
                        u.usuario AS nombre_creador_usuario,
                        u.profile_image AS creador_profile_image,
                        est.nombre,
                        est.id as estado_id,
                        (SELECT COUNT(*) FROM LikesDislikesEventos WHERE evento_id = e.id AND tipo = 'like') AS total_likes,
                        (SELECT COUNT(*) FROM LikesDislikesEventos WHERE evento_id = e.id AND tipo = 'dislike') AS total_dislikes,
                        (SELECT 1 FROM InscripcionesEventos WHERE evento_id = e.id AND usuario_id = :usuario_logueado_id) AS esta_inscrito,
                        (SELECT tipo FROM LikesDislikesEventos WHERE evento_id = e.id AND usuario_id = :usuario_logueado_id AND :usuario_logueado_id IS NOT NULL) AS mi_like_dislike
                     FROM Eventos e
                     LEFT JOIN Usuarios u ON e.usuario_creador_id = u.id
                     left join estadosevento est on est.id = e.estado_id
                     WHERE e.id = :evento_id";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $stmt->bindParam(':usuario_logueado_id', $usuario_logueado_id, PDO::PARAM_INT);
    $stmt->execute();
    $evento = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($evento) {

        $evento['imagen_portada'] = BASE_URL . $evento['imagen_portada'];
        $evento['creador_profile_image'] = BASE_URL .  $evento['creador_profile_image'];

        http_response_code(200);
        echo json_encode($evento);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Evento no encontrado."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>