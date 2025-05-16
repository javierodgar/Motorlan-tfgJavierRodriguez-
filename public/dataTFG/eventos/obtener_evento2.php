<?php
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../db_config.php';

$db = $pdo;

if (isset($_GET['id'])) {
    $id = htmlspecialchars(strip_tags($_GET['id']));

    $query = "SELECT
                id,
                titulo,
                descripcion,
                categoria,
                imagen_portada,
                direccion,
                fecha_inicio,
                fecha_fin,
                estado_id,
                ST_X(coordenadas) AS longitud,
                ST_Y(coordenadas) AS latitud
            FROM
                Eventos
            WHERE
                id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            http_response_code(200);
            $row["image_preview"] = BASE_URL . $row["imagen_portada"];
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "No se encontró ningún evento con el ID proporcionado."));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Error al ejecutar la consulta."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Por favor, proporciona un ID de evento."));
}
?>