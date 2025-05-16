<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Respuesta OK
    exit;
}

require_once '../db_config.php';

try {
    if (isset($_POST['evento_id']) && isset($_POST['estado_id'])) {
        $evento_id = filter_var($_POST['evento_id'], FILTER_VALIDATE_INT);
        $estado_id = filter_var($_POST['estado_id'], FILTER_VALIDATE_INT);

        if ($evento_id === false || $estado_id === false) {
            http_response_code(400); // Bad Request
            echo json_encode(array("error" => "Los parámetros evento_id y estado_id deben ser números enteros válidos."));
            exit;
        }

        if ($estado_id === 1 || $estado_id === 4) {
            $sql = "UPDATE Eventos SET estado_id = :estado_id WHERE id = :evento_id";
            $stmt = $pdo->prepare($sql);

            $stmt->bindParam(':estado_id', $estado_id, PDO::PARAM_INT);
            $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {

                    http_response_code(200); 
                    echo json_encode(array("mensaje" => "Estado del evento actualizado correctamente."));
                } else {
                    http_response_code(404); 
                    echo json_encode(array("error" => "No se encontró ningún evento con el ID proporcionado."));
                }
            } else {
                http_response_code(500); 
                echo json_encode(array("error" => "Error al actualizar el estado del evento: " . $stmt->errorInfo()[2]));
            }


            $stmt = null;

        } else {
            http_response_code(400); 
            echo json_encode(array("error" => "El estado_id debe ser 1 (Creado) o 4 (Cancelado)."));
        }
    } else {

        http_response_code(400); 
        echo json_encode(array("error" => "Faltan parámetros: evento_id y/o estado_id."));
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("error" => "Error de conexión a la base de datos: " . $e->getMessage()));
}

?>