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

require_once '../db_config.php';


if (!$pdo) {
    error_log("[actualizar_estados.php] No se pudo establecer la conexión PDO.");
    echo json_encode(['success' => false, 'message' => 'Error al conectar a la base de datos.']);
    exit;
}

$ahora = new DateTime();
$ahora_formateado = $ahora->format('Y-m-d H:i:s');

try {
    $stmt_inicio = $pdo->prepare("UPDATE Eventos SET estado_id = 2 WHERE estado_id = 1 AND fecha_inicio <= :ahora");
    $stmt_inicio->bindParam(':ahora', $ahora_formateado);
    $stmt_inicio->execute();
    $procesados_inicio = $stmt_inicio->rowCount();
    if ($procesados_inicio > 0) {
        error_log("[actualizar_estados.php] Eventos pasados a 'En Proceso' (" . $ahora_formateado . "): " . $procesados_inicio);
    }

    $stmt_fin = $pdo->prepare("UPDATE Eventos SET estado_id = 3 WHERE estado_id = 2 AND fecha_fin <= :ahora");
    $stmt_fin->bindParam(':ahora', $ahora_formateado);
    $stmt_fin->execute();
    $finalizados = $stmt_fin->rowCount();
    if ($finalizados > 0) {
        error_log("[actualizar_estados.php] Eventos pasados a 'Finalizado' (" . $ahora_formateado . "): " . $finalizados);
    }

    echo json_encode(['success' => true, 'message' => 'Estados de eventos actualizados.', 'en_proceso' => $procesados_inicio, 'finalizados' => $finalizados]);

} catch(PDOException $e) {
    error_log("[actualizar_estados.php] Error en la actualización de eventos (" . $ahora_formateado . "): " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al actualizar los estados de los eventos: ' . $e->getMessage()]);
} finally {
    if ($pdo) {
        $pdo = null;
    }
}
?>