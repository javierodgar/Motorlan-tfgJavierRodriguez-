<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db_config.php';

$evento_id = isset($_GET['evento_id']) ? intval($_GET['evento_id']) : 0;

if ($evento_id > 0) {
    try {
        $query = "SELECT comentariosEventos.id, evento_id, usuario_id, texto, fecha_creacion, nombre FROM ComentariosEventos inner join Usuarios on ComentariosEventos.usuario_id = Usuarios.id
         WHERE evento_id = :evento_id ORDER BY fecha_creacion DESC";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
        $stmt->execute();
        $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($comentarios);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error al obtener los comentarios: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Se requiere el ID del evento."]);
}
?>