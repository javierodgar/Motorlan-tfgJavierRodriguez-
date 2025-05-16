<?php
  header('Content-Type: application/json');
  header('Access-Control-Allow-Origin: *'); 
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
  }

  $jsonFilePath = './Insultos.json';

  if (file_exists($jsonFilePath)) {
    $jsonData = file_get_contents($jsonFilePath);
    echo $jsonData;
  } else {
    http_response_code(404);
    echo json_encode(['error' => 'Archivo JSON no encontrado']);
  }
?>