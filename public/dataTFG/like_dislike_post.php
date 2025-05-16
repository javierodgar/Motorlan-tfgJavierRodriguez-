<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

try {
    if (!isset($pdo)) {
        throw new Exception("Error: La conexión a la base de datos no se ha establecido.");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

try {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->publicacion_id) || empty($data->username) || empty($data->tipo) || !in_array($data->tipo, ['like', 'dislike'])) {
        http_response_code(400);
        echo json_encode(["message" => "Datos incompletos o tipo de acción inválido."]);
        exit;
    }
    $publicacionId = intval($data->publicacion_id);
    $username = $data->username;
    $tipo = $data->tipo;
    $queryUsuarioLiker = "SELECT id FROM Usuarios WHERE usuario = :username";
    $stmtUsuarioLiker = $pdo->prepare($queryUsuarioLiker);
    $stmtUsuarioLiker->bindParam(":username", $username, PDO::PARAM_STR);
    $stmtUsuarioLiker->execute();
    $usuarioLiker = $stmtUsuarioLiker->fetch(PDO::FETCH_ASSOC);
    if (!$usuarioLiker) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró el usuario que realizó la acción."]);
        exit;
    }
    $usuarioLikerId = $usuarioLiker['id'];
    $queryAutorPublicacion = "SELECT usuario FROM Publicaciones WHERE id = :publicacion_id";
    $stmtAutorPublicacion = $pdo->prepare($queryAutorPublicacion);
    $stmtAutorPublicacion->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $stmtAutorPublicacion->execute();
    $autorPublicacion = $stmtAutorPublicacion->fetch(PDO::FETCH_ASSOC);
    if (!$autorPublicacion) {
        http_response_code(404);
        echo json_encode(["message" => "No se encontró la publicación."]);
        exit;
    }
    $autorUsername = $autorPublicacion['usuario'];
    $checkQuery = "SELECT id, tipo FROM LikesDislikes WHERE publicacion_id = :publicacion_id AND usuario_id = :usuario_id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
    $checkStmt->bindParam(":usuario_id", $usuarioLikerId, PDO::PARAM_INT);
    $checkStmt->execute();
    $existingInteraction = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $accionRegistrada = false;
    if ($existingInteraction) {
        if ($existingInteraction['tipo'] === $tipo) {
            $deleteQuery = "DELETE FROM LikesDislikes WHERE id = :id";
            $deleteStmt = $pdo->prepare($deleteQuery);
            $deleteStmt->bindParam(":id", $existingInteraction['id'], PDO::PARAM_INT);
            if ($deleteStmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Acción de " . $tipo . " eliminada."]);
                $accionRegistrada = true;
                $factorValoracion = ($tipo === 'like') ? -0.01 : 0.01;
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al eliminar la acción de " . $tipo . "."]);
                exit;
            }
        } else {
            $updateQuery = "UPDATE LikesDislikes SET tipo = :tipo, fecha_accion = CURRENT_TIMESTAMP WHERE id = :id";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->bindParam(":tipo", $tipo, PDO::PARAM_STR);
            $updateStmt->bindParam(":id", $existingInteraction['id'], PDO::PARAM_INT);
            if ($updateStmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Acción actualizada a " . $tipo . "."]);
                $accionRegistrada = true;
                $factorValoracion = ($tipo === 'like') ? 0.02 : -0.02;
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al actualizar la acción."]);
                exit;
            }
        }
    } else {
        $insertQuery = "INSERT INTO LikesDislikes (publicacion_id, usuario_id, tipo) VALUES (:publicacion_id, :usuario_id, :tipo)";
        $insertStmt = $pdo->prepare($insertQuery);
        $insertStmt->bindParam(":publicacion_id", $publicacionId, PDO::PARAM_INT);
        $insertStmt->bindParam(":usuario_id", $usuarioLikerId, PDO::PARAM_INT);
        $insertStmt->bindParam(":tipo", $tipo, PDO::PARAM_STR);
        if ($insertStmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Acción de " . $tipo . " registrada."]);
            $accionRegistrada = true;
            $factorValoracion = ($tipo === 'like') ? 0.01 : -0.01;
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al registrar la acción."]);
            exit;
        }
    }
    if ($accionRegistrada && isset($factorValoracion)) {
        $updateValoracionQuery = "UPDATE Usuarios SET valoracion_global = valoracion_global + :factor WHERE usuario = :autor_username";
        $updateValoracionStmt = $pdo->prepare($updateValoracionQuery);
        $updateValoracionStmt->bindParam(":factor", $factorValoracion, PDO::PARAM_STR);
        $updateValoracionStmt->bindParam(":autor_username", $autorUsername, PDO::PARAM_STR);
        if (!$updateValoracionStmt->execute()) {
            error_log("Error al actualizar la valoración del usuario " . $autorUsername . ": " . print_r($updateValoracionStmt->errorInfo(), true));
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>