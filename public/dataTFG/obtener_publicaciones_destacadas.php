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

require 'db_config.php'; 

if (isset($_GET['usuario'])) {
    $usuarioLogueado = $_GET['usuario'];

    try {
        $stmt_usuario_logueado = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :usuario");
        $stmt_usuario_logueado->bindParam(':usuario', $usuarioLogueado, PDO::PARAM_STR);
        $stmt_usuario_logueado->execute();
        $resultado_usuario_logueado = $stmt_usuario_logueado->fetch(PDO::FETCH_ASSOC);

        $usuarioLogueadoId = $resultado_usuario_logueado ? $resultado_usuario_logueado['id'] : null;

        if ($usuarioLogueadoId) {
            $stmt = $pdo->prepare("SELECT p.*, COUNT(ld.tipo) AS num_likes
                                    FROM Publicaciones p
                                    INNER JOIN LikesDislikes ld ON p.id = ld.publicacion_id AND ld.tipo = 'like'
                                    WHERE p.fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
                                    AND p.usuario NOT IN (
                                        SELECT u.usuario
                                        FROM Usuarios u
                                        INNER JOIN Bloqueos b ON u.id = b.usuario_bloqueador
                                        WHERE b.usuario_bloqueado = :usuario_logueado_id
                                    )
                                    AND p.usuario != :usuario_logueado
                                    GROUP BY p.id
                                    ORDER BY num_likes DESC
                                    LIMIT 10");
            $stmt->bindParam(':usuario_logueado_id', $usuarioLogueadoId, PDO::PARAM_INT);
            $stmt->bindParam(':usuario_logueado', $usuarioLogueado, PDO::PARAM_STR);
            $stmt->execute();
            $publicacionesDestacadas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($publicacionesDestacadas);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Usuario no encontrado.']);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener las publicaciones destacadas: ' . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'El parámetro usuario es requerido.']);
}
?>
