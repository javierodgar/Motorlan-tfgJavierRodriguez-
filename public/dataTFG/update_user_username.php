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
$newUsername = $data["usuarioNuevo"] ?? null;


try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
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

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM Usuarios WHERE usuario = :newUsername AND id != :id_usuario");
    $stmtCheck->bindParam(":newUsername", $newUsername);
    $stmtCheck->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
    $stmtCheck->execute();
    if ($stmtCheck->fetchColumn() > 0) {
        http_response_code(409); 
        echo json_encode(["message" => "El nuevo nombre de usuario ya está en uso"]);
        exit;
    }

    $stmtReservado = $pdo->prepare("select count(id) from usernameChangeLog where old_username = :old_username and change_date >= CURDATE() - INTERVAL 30 DAY and reverted = 0");
    $stmtReservado->bindParam(":old_username", $newUsername);
    $stmtReservado->execute();
    if ($stmtReservado->fetchColumn() > 0) {
        http_response_code(409); 
        echo json_encode(["message" => "El nuevo nombre de usuario se encuentre reservado por un cambio reciente"]);
        exit;
    }

    $stmtUpdateUser = $pdo->prepare("UPDATE Usuarios SET usuario = :newUsername WHERE id = :id_usuario");
    $stmtUpdateUser->bindParam(":newUsername", $newUsername);
    $stmtUpdateUser->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
    $userUpdated = $stmtUpdateUser->execute();
    $logError = null;

    if ($userUpdated) {
        if ($stmtUpdateUser->rowCount() > 0) {

            $stmtLog = $pdo->prepare("INSERT INTO usernameChangeLog (user_id, old_username, new_username) VALUES (:user_id, :old_username, :new_username)");
            $stmtLog->bindParam(":user_id", $id_usuario, PDO::PARAM_INT);
            $stmtLog->bindParam(":old_username", $username);
            $stmtLog->bindParam(":new_username", $newUsername);

            if (!$stmtLog->execute()) {
                $logError = "Error al insertar log de cambio de nombre: " . print_r($stmtLog->errorInfo(), true);
            }

            $stmtPublicaciones = $pdo->prepare("UPDATE Publicaciones SET usuario = :newUsername WHERE usuario = :username");
            $stmtPublicaciones->bindParam(":newUsername", $newUsername);
            $stmtPublicaciones->bindParam(":username", $username);
            $stmtPublicaciones->execute();

            $stmtSeguidoresSeguidor = $pdo->prepare("UPDATE Seguidores SET seguidor = :newUsername WHERE seguidor = :username");
            $stmtSeguidoresSeguidor->bindParam(":newUsername", $newUsername);
            $stmtSeguidoresSeguidor->bindParam(":username", $username);
            $stmtSeguidoresSeguidor->execute();

            $stmtSeguidoresSeguido = $pdo->prepare("UPDATE Seguidores SET seguido = :newUsername WHERE seguido = :username");
            $stmtSeguidoresSeguido->bindParam(":newUsername", $newUsername);
            $stmtSeguidoresSeguido->bindParam(":username", $username);
            $stmtSeguidoresSeguido->execute();

            http_response_code(200);
            $responseMessage = "Nombre de usuario actualizado exitosamente";
            if ($logError) {
                $responseMessage .= " pero hubo un problema al registrar el log: " . $logError;
            }
            echo json_encode(["message" => $responseMessage]);

        } else {
            http_response_code(200);
            echo json_encode(["message" => "No se realizaron cambios en el nombre de usuario"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar el nombre de usuario: " . print_r($stmtUpdateUser->errorInfo(), true)]);
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
} catch (PDOException $e) {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>