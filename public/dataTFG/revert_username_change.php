<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

$response = array();

$jsonData = file_get_contents("php://input");
$data = json_decode($jsonData, true);
$username = $data['username_to_revert'] ?? null;

if (empty($username)) {
    http_response_code(400);
    $response['message'] = "Debes proporcionar el nombre de usuario para revertir.";
    echo json_encode($response);
    exit;
}
    
    try {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

        $stmtUserId = $pdo->prepare("SELECT id, usuario FROM Usuarios WHERE usuario = :username");
        $stmtUserId->bindParam(":username", $username, PDO::PARAM_STR);
        $stmtUserId->execute();
        $userResult = $stmtUserId->fetch(PDO::FETCH_ASSOC);
    
        if (!$userResult || !isset($userResult['id']) || !isset($userResult['usuario'])) {
            http_response_code(404);
            $response['message'] = "Usuario no encontrado.";
            echo json_encode($response);
            exit;
        }
    
        $user_id = $userResult['id'];
        $current_username = $userResult['usuario'];
    
        $stmtLastChange = $pdo->prepare("SELECT old_username, id AS log_id
                                        FROM usernameChangeLog
                                        WHERE user_id = :user_id
                                        AND reverted = FALSE
                                        AND change_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                                        ORDER BY change_date DESC
                                        LIMIT 1");
        $stmtLastChange->bindParam(":user_id", $user_id, PDO::PARAM_INT);
        $stmtLastChange->execute();
        $lastChange = $stmtLastChange->fetch(PDO::FETCH_ASSOC);
    
        if (!$lastChange) {
            http_response_code(404);
            $response['message'] = "No se encontró un cambio de nombre reciente para revertir en este mes.";
            echo json_encode($response);
            exit;
        }
    
        $old_username = $lastChange['old_username'];
        $log_id_to_revert = $lastChange['log_id'];
    
        $stmtUpdateUser = $pdo->prepare("UPDATE Usuarios SET usuario = :old_username WHERE id = :user_id");
        $stmtUpdateUser->bindParam(":old_username", $old_username, PDO::PARAM_STR);
        $stmtUpdateUser->bindParam(":user_id", $user_id, PDO::PARAM_INT);
        $stmtUpdateUser->execute();
        $userUpdated = $stmtUpdateUser->rowCount() > 0;
    
        $stmtUpdatePosts = $pdo->prepare("UPDATE Publicaciones SET usuario = :old_username WHERE usuario = :current_username");
        $stmtUpdatePosts->bindParam(":old_username", $old_username, PDO::PARAM_STR);
        $stmtUpdatePosts->bindParam(":current_username", $current_username, PDO::PARAM_STR);
        $stmtUpdatePosts->execute();
        $postsUpdated = $stmtUpdatePosts->rowCount() >= 0; // Puede ser 0 si no hay publicaciones
    
        $stmtUpdateFollowersAsFollower = $pdo->prepare("UPDATE Seguidores SET seguidor = :old_username WHERE seguidor = :current_username");
        $stmtUpdateFollowersAsFollower->bindParam(":old_username", $old_username, PDO::PARAM_STR);
        $stmtUpdateFollowersAsFollower->bindParam(":current_username", $current_username, PDO::PARAM_STR);
        $stmtUpdateFollowersAsFollower->execute();
        $followersAsFollowerUpdated = $stmtUpdateFollowersAsFollower->rowCount() >= 0;
    
        $stmtUpdateFollowersAsFollowed = $pdo->prepare("UPDATE Seguidores SET seguido = :old_username WHERE seguido = :current_username");
        $stmtUpdateFollowersAsFollowed->bindParam(":old_username", $old_username, PDO::PARAM_STR);
        $stmtUpdateFollowersAsFollowed->bindParam(":current_username", $current_username, PDO::PARAM_STR);
        $stmtUpdateFollowersAsFollowed->execute();
        $followersAsFollowedUpdated = $stmtUpdateFollowersAsFollowed->rowCount() >= 0;
    
        $stmtUpdateLog = $pdo->prepare("UPDATE usernameChangeLog
                                       SET reverted = TRUE, reverted_date = CURRENT_TIMESTAMP
                                       WHERE id = :log_id");
        $stmtUpdateLog->bindParam(":log_id", $log_id_to_revert, PDO::PARAM_INT);
        $stmtUpdateLog->execute();
        $logUpdated = $stmtUpdateLog->rowCount() > 0;
    
        if ($userUpdated && $logUpdated && $postsUpdated && $followersAsFollowerUpdated && $followersAsFollowedUpdated) {
            $response['message'] = "Nombre de usuario revertido exitosamente a: " . $old_username . " y actualizado en las tablas relacionadas.";
            http_response_code(200);
        } else {
            http_response_code(500);
            $response['message'] = "Ocurrió un error al revertir el nombre de usuario o al actualizar las tablas relacionadas.";
        }
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    } catch (PDOException $e) {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

        http_response_code(500);
        $response['message'] = "Error en el servidor: " . $e->getMessage();
    }
    
    echo json_encode($response);
    ?>