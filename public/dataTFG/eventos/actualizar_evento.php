<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../db_config.php';

$id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID del evento no proporcionado.']);
    exit;
}

$titulo = isset($_POST['titulo']) ? mb_convert_encoding($_POST['titulo'], 'UTF-8') : '';
$descripcion = isset($_POST['descripcion']) ? mb_convert_encoding($_POST['descripcion'], 'UTF-8') : '';
$categoria = isset($_POST['categoria']) ? mb_convert_encoding($_POST['categoria'], 'UTF-8') : '';
$imagen_existente = isset($_POST['imagen_existente']) ? $_POST['imagen_existente'] : '';
$direccion = isset($_POST['direccion']) ? mb_convert_encoding($_POST['direccion'], 'UTF-8') : '';
$fecha_inicio = isset($_POST['fecha_inicio']) ? $_POST['fecha_inicio'] : '';
$fecha_fin = isset($_POST['fecha_fin']) ? $_POST['fecha_fin'] : '';
$latitud = isset($_POST['latitud']) ? $_POST['latitud'] : null;
$longitud = isset($_POST['longitud']) ? $_POST['longitud'] : null;


$nombre_imagen_db = $imagen_existente;      
$directorio_destino_fisico = '../uploads/'; 
$directorio_destino_db = 'uploads/';        

if (isset($_FILES['imagen_portada']) && $_FILES['imagen_portada']['error'] === UPLOAD_ERR_OK) {
    $nombre_temporal = $_FILES['imagen_portada']['tmp_name'];
    $nombre_archivo = basename($_FILES['imagen_portada']['name']);
    $ruta_fisica_completa = $directorio_destino_fisico . $nombre_archivo;
    $nombre_imagen_db =   $directorio_destino_db . $nombre_archivo; 

    $tipos_permitidos = ['image/jpeg', 'image/png'];
    if (in_array($_FILES['imagen_portada']['type'], $tipos_permitidos) && $_FILES['imagen_portada']['size'] < 2000000) {
        if (!is_dir($directorio_destino_fisico)) {
            mkdir($directorio_destino_fisico, 0755, true);
        }
        if (move_uploaded_file($nombre_temporal, $ruta_fisica_completa)) {
            if ($imagen_existente && file_exists($imagen_existente) && strpos($imagen_existente, 'uploads/') !== false) {
                $ruta_fisica_anterior =  '../' . $imagen_existente;
                if (file_exists($ruta_fisica_anterior)) {
                    unlink($ruta_fisica_anterior);
                }
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al guardar la nueva imagen.']);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de archivo no válido o demasiado grande.']);
        exit;
    }
}

try {
    $stmt = $pdo->prepare("UPDATE Eventos SET
        titulo = :titulo,
        descripcion = :descripcion,
        categoria = :categoria,
        imagen_portada = :imagen_portada,
        direccion = :direccion,
        fecha_inicio = :fecha_inicio,
        fecha_fin = :fecha_fin,
        coordenadas = POINT(:longitud, :latitud)
        WHERE id = :id");

    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->bindParam(':titulo', $titulo, PDO::PARAM_STR);
    $stmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
    $stmt->bindParam(':categoria', $categoria, PDO::PARAM_STR);
    $stmt->bindParam(':imagen_portada', $nombre_imagen_db, PDO::PARAM_STR); 
    $stmt->bindParam(':direccion', $direccion, PDO::PARAM_STR);
    $stmt->bindParam(':fecha_inicio', $fecha_inicio, PDO::PARAM_STR);
    $stmt->bindParam(':fecha_fin', $fecha_fin, PDO::PARAM_STR);
    $stmt->bindParam(':latitud', $latitud, PDO::PARAM_STR);
    $stmt->bindParam(':longitud', $longitud, PDO::PARAM_STR);

    if ($stmt->execute()) {
        echo json_encode(['mensaje' => 'Evento actualizado con éxito.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar el evento en la base de datos.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}

?>
