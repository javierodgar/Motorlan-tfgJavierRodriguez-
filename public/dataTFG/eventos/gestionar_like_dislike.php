<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); 
    exit;
}

require_once '../db_config.php'; 

try {
    $data = json_decode(file_get_contents("php://input"));

    $evento_id = isset($data->evento_id) ? filter_var($data->evento_id, FILTER_SANITIZE_NUMBER_INT) : null;
    $username = isset($data->username) ? filter_var($data->username, FILTER_SANITIZE_STRING) : null;
    $tipo = isset($data->tipo) ? filter_var($data->tipo, FILTER_SANITIZE_STRING) : null; // 'like' o 'dislike'

    if (empty($evento_id) || $evento_id <= 0 || empty($tipo) || !in_array($tipo, ['like', 'dislike']) || empty($username)) {
        http_response_code(400);
        echo json_encode(["message" => "Datos de like/dislike no válidos."]);
        exit;
    }

    $user_id_query = "SELECT id FROM Usuarios WHERE usuario = :username";
    $user_id_stmt = $pdo->prepare($user_id_query);
    $user_id_stmt->bindParam(':username', $username);
    $user_id_stmt->execute();
    $user_liker = $user_id_stmt->fetch(PDO::FETCH_ASSOC);
    $usuario_id_liker = $user_liker ? $user_liker['id'] : null;

    if (!$usuario_id_liker) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
        exit;
    }

    $evento_autor_query = "SELECT u.usuario FROM Eventos e JOIN Usuarios u ON e.usuario_creador_id = u.id WHERE e.id = :evento_id";
    $evento_autor_stmt = $pdo->prepare($evento_autor_query);
    $evento_autor_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $evento_autor_stmt->execute();
    $evento_autor = $evento_autor_stmt->fetch(PDO::FETCH_ASSOC);
    $autor_username_evento = $evento_autor ? $evento_autor['usuario'] : null;

    if (!$autor_username_evento) {
        http_response_code(404);
        echo json_encode(["message" => "Evento no encontrado o no tiene un creador asociado."]);
        exit;
    }

    $check_query = "SELECT id, tipo FROM LikesDislikesEventos WHERE evento_id = :evento_id AND usuario_id = :usuario_id";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
    $check_stmt->bindParam(':usuario_id', $usuario_id_liker, PDO::PARAM_INT);
    $check_stmt->execute();
    $existing_like = $check_stmt->fetch(PDO::FETCH_ASSOC);

    $accionRegistrada = false;
    $factorValoracionEvento = 0;

    if ($existing_like) {
        if ($existing_like['tipo'] === $tipo) {
            $delete_query = "DELETE FROM LikesDislikesEventos WHERE id = :like_id";
            $delete_stmt = $pdo->prepare($delete_query);
            $delete_stmt->bindParam(':like_id', $existing_like['id'], PDO::PARAM_INT);
            if ($delete_stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Like/dislike eliminado."]);
                $accionRegistrada = true;
                $factorValoracionEvento = ($tipo === 'like') ? -0.05 : 0.05; 
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al eliminar like/dislike."]);
            }
        } else {
            $update_query = "UPDATE LikesDislikesEventos SET tipo = :tipo WHERE id = :like_id";
            $update_stmt = $pdo->prepare($update_query);
            $update_stmt->bindParam(':tipo', $tipo);
            $update_stmt->bindParam(':like_id', $existing_like['id'], PDO::PARAM_INT);
            if ($update_stmt->execute()) {
                http_response_code(200);
                echo json_encode(["message" => "Like/dislike actualizado a " . $tipo . "."]);
                $accionRegistrada = true;
                $factorValoracionEvento = ($tipo === 'like') ? 0.05 : -0.05; 
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al actualizar like/dislike."]);
            }
        }
    } else {
        $insert_query = "INSERT INTO LikesDislikesEventos (evento_id, usuario_id, tipo) VALUES (:evento_id, :usuario_id, :tipo)";
        $insert_stmt = $pdo->prepare($insert_query);
        $insert_stmt->bindParam(':evento_id', $evento_id, PDO::PARAM_INT);
        $insert_stmt->bindParam(':usuario_id', $usuario_id_liker, PDO::PARAM_INT);
        $insert_stmt->bindParam(':tipo', $tipo);
        if ($insert_stmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Evento " . $tipo . " registrado."]);
            $accionRegistrada = true;
            $factorValoracionEvento = ($tipo === 'like') ? 0.05 : -0.05; 
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al dar " . $tipo . " al evento."]);
        }
    }

    if ($accionRegistrada && isset($factorValoracionEvento) && $autor_username_evento) {
        $updateValoracionQuery = "UPDATE Usuarios SET valoracion_global = valoracion_global + :factor WHERE usuario = :autor_username";
        $updateValoracionStmt = $pdo->prepare($updateValoracionQuery);
        $updateValoracionStmt->bindParam(":factor", $factorValoracionEvento, PDO::PARAM_STR);
        $updateValoracionStmt->bindParam(":autor_username", $autor_username_evento, PDO::PARAM_STR);

        if (!$updateValoracionStmt->execute()) {
            // Log del error de actualización de valoración (no crítico para la acción de like/dislike)
            error_log("Error al actualizar la valoración del usuario " . $autor_username_evento . ": " . print_r($updateValoracionStmt->errorInfo(), true));
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>