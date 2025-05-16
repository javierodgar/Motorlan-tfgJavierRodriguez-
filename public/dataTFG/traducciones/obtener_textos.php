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

if (isset($_GET['archivo'])) {
    $nombreArchivo = $_GET['archivo'];
    $rutaArchivo = './' . $nombreArchivo . '.json';

    if (file_exists($rutaArchivo)) {
        $contenido = file_get_contents($rutaArchivo);
        if ($contenido !== false) {
            echo $contenido;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Error al leer el archivo JSON.']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'El archivo JSON no fue encontrado.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'No se proporcionó el nombre del archivo.']);
}
?>