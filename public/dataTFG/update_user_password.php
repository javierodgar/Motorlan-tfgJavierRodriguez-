<?php

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 3600");
    http_response_code(200);
    exit;
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "Error al decodificar JSON"]);
    exit;
}

$username = $data["usuario"] ?? null;
$newPassword = $data["newPassword"] ?? null;

try {
    

    if (empty($username) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode(["message" => "El nombre de usuario y la nueva contraseña son obligatorios"]);
        exit;
    }


    $stmtId = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :username");
    $stmtId->bindParam(":username", $username);
    $stmtId->execute();
    $userResult = $stmtId->fetch(PDO::FETCH_ASSOC);

    if (!$userResult) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado"]);
        exit;
    }

    $id_usuario = $userResult['id'];

    $stmt = $pdo->prepare("UPDATE Usuarios SET contrasena = :contrasena WHERE id = :id_usuario");
    $stmt->bindParam(":contrasena", $newPassword); 
    $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Contraseña actualizada exitosamente"]);
        } else {
            http_response_code(200);
            echo json_encode(["message" => "No se realizaron cambios en la contraseña"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar la contraseña: " . $stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>