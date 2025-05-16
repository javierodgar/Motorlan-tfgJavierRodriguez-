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

$nombreUsuarioExcluir = isset($_GET['excluir_usuario']) ? $_GET['excluir_usuario'] : null;

if ($nombreUsuarioExcluir === null) {
    echo json_encode(["error" => "El parámetro 'excluir_usuario' es obligatorio."]);
    exit();
}

try {

    $stmtUsuario = $pdo->prepare("
        SELECT id
        FROM Usuarios
        WHERE usuario = :nombre_usuario_excluir
    ");
    $stmtUsuario->bindParam(':nombre_usuario_excluir', $nombreUsuarioExcluir, PDO::PARAM_STR);
    $stmtUsuario->execute();
    $usuarioExcluir = $stmtUsuario->fetch(PDO::FETCH_ASSOC);

    if (!$usuarioExcluir) {
        echo json_encode([]); 
        exit();
    }

    $usuarioIdExcluir = $usuarioExcluir['id'];

    $stmtEventos = $pdo->prepare("
        SELECT
            e.id AS evento_id,
            e.titulo,
            e.fecha_creacion,
            COUNT(ie.usuario_id) AS cantidad_inscripciones
        FROM Eventos e
        LEFT JOIN InscripcionesEventos ie ON e.id = ie.evento_id
        WHERE e.usuario_creador_id <> :usuario_id_excluir
        AND e.usuario_creador_id NOT IN (
            SELECT b.usuario_bloqueador
            FROM Bloqueos b
            WHERE b.usuario_bloqueado = :usuario_id_excluir
        )
        GROUP BY e.id
        ORDER BY cantidad_inscripciones DESC
        LIMIT 10;
    ");

    $stmtEventos->bindParam(':usuario_id_excluir', $usuarioIdExcluir, PDO::PARAM_INT);
    $stmtEventos->execute();
    $eventosPopulares = $stmtEventos->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($eventosPopulares);

} catch (PDOException $e) {
    echo json_encode(["error" => "Error al ejecutar la consulta: " . $e->getMessage()]);
} finally {
}
?>
