<?php
// editar_evento.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db_config.php'; 

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($_POST['id']) || empty($_POST['id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el ID del evento para editar."]);
        exit;
    }

    $evento_id = filter_var($_POST['id'], FILTER_SANITIZE_NUMBER_INT);
    $titulo = filter_var($_POST['titulo'], FILTER_SANITIZE_STRING);
    $descripcion = filter_var($_POST['descripcion'], FILTER_SANITIZE_STRING);
    $categoria = filter_var($_POST['categoria'], FILTER_SANITIZE_STRING);
    $direccion = filter_var($_POST['direccion'], FILTER_SANITIZE_STRING);
    $fecha_inicio = filter_var($_POST['fecha_inicio'], FILTER_SANITIZE_STRING);
    $fecha_fin = filter_var($_POST['fecha_fin'], FILTER_SANITIZE_STRING);
    $latitud = filter_var($_POST['latitud'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $longitud = filter_var($_POST['longitud'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

    $query = "UPDATE Eventos SET
                    titulo = :titulo,
                    descripcion = :descripcion,
                    categoria = :categoria,
                    direccion = :direccion,
                    fecha_inicio = :fecha_inicio,
                    fecha_fin = :fecha_fin,
                    coordenadas = POINT(:longitud, :latitud),
                    fecha_modificacion = NOW()
                    WHERE id = :evento_id";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':titulo', $titulo);
    $stmt->bindParam(':descripcion', $descripcion);
    $stmt->bindParam(':categoria', $categoria);
    $stmt->bindParam(':direccion', $direccion);
    $stmt->bindParam(':fecha_inicio', $fecha_inicio);
    $stmt->bindParam(':fecha_fin', $fecha_fin);
    $stmt->bindParam(':latitud', $latitud);
    $stmt->bindParam(':longitud', $longitud);
    $stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if (isset($_FILES['imagen_portada']) && $_FILES['imagen_portada']['error'] === UPLOAD_ERR_OK) {
            $uploadDir2 = 'uploads/'
            $uploadDir = '../uploads/';
            $nombreBase = basename($_FILES['imagen_portada']['name']);
            $nombreArchivo = uniqid() . '_' . $nombreBase;
            $rutaArchivo = $uploadDir . $nombreArchivo;
            $rutaArchivoParaDB =   $uploadDir2 . $nombreArchivo; 

            $allowedTypes = ['image/jpeg', 'image/png'];
            if (in_array($_FILES['imagen_portada']['type'], $allowedTypes)) {
                if (move_uploaded_file($_FILES['imagen_portada']['tmp_name'], $rutaArchivo)) {
                    $updateImagenQuery = "UPDATE Eventos SET imagen_portada = :imagen_portada WHERE id = :evento_id";
                    $updateImagenStmt = $pdo->prepare($updateImagenQuery);
                    $updateImagenStmt->bindParam(':imagen_portada', $rutaArchivoParaDB); 
                    $updateImagenStmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
                    $updateImagenStmt->execute();
                } else {
                    http_response_code(500);
                    echo json_encode(["message" => "Error al subir la nueva imagen."]);
                    exit;
                }
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Tipo de archivo de imagen no permitido (solo JPEG y PNG)."]);
                exit;
            }
        }

        http_response_code(200);
        echo json_encode(["message" => "Evento actualizado con éxito."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar el evento."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>