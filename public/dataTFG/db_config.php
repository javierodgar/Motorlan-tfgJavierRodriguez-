<?php

$environment = 'development'; 

if ($environment === 'development') {
    $baseUrl = 'http://localhost/dataTFG/'; 
} else {
    $baseUrl = 'https://dominio cunado despliege/';
}

$baseUrl = rtrim($baseUrl, '/') . '/';

define('BASE_URL', $baseUrl);
define('UPLOAD_DIR', 'uploads/');

$host = "localhost"; 
$dbname = "RegistroUsuarioss"; 
$user = "root";                
$password = "root";            

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al conectar a la base de datos: " . $e->getMessage()]);
    exit;
}
?>