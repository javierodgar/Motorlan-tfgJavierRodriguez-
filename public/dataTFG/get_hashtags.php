<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

try {
    
    $query = isset($_GET['query']) ? $_GET['query'] : '';

    $hashtags = [];
    if (!empty($query)) {
        $stmt = $pdo->prepare("SELECT nombre FROM Hashtags WHERE nombre LIKE :query LIMIT 10"); // Limitar los resultados
        $searchTerm = '%' . $query . '%';
        $stmt->bindParam(':query', $searchTerm);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($results as $row) {
            $hashtags[] = ['name' => $row['nombre']];
        }
    } else {
        
    }

    echo json_encode($hashtags);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
}
?>