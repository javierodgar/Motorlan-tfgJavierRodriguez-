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

require_once 'db_config.php'; 

try {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->usuario_bloqueador) || empty($data->usuario_bloqueado)) {
        http_response_code(400);
        echo json_encode(["message" => "Se requieren los nombres de usuario del bloqueador y del bloqueado."]);
        exit;
    }

    $usuarioBloqueadorNombre = filter_var($data->usuario_bloqueador, FILTER_SANITIZE_STRING);
    $usuarioBloqueadoNombre = filter_var($data->usuario_bloqueado, FILTER_SANITIZE_STRING);

    $queryUsuarios = "SELECT id, usuario FROM Usuarios WHERE usuario = :usuario_bloqueador OR usuario = :usuario_bloqueado";
    $stmtUsuarios = $pdo->prepare($queryUsuarios);
    $stmtUsuarios->bindParam(":usuario_bloqueador", $usuarioBloqueadorNombre, PDO::PARAM_STR);
    $stmtUsuarios->bindParam(":usuario_bloqueado", $usuarioBloqueadoNombre, PDO::PARAM_STR);
    $stmtUsuarios->execute();
    $usuariosResult = $stmtUsuarios->fetchAll(PDO::FETCH_ASSOC);

    $idBloqueador = null;
    $idBloqueado = null;

    foreach ($usuariosResult as $usuario) {
        if ($usuario['usuario'] === $usuarioBloqueadorNombre) {
            $idBloqueador = $usuario['id'];
        } elseif ($usuario['usuario'] === $usuarioBloqueadoNombre) {
            $idBloqueado = $usuario['id'];
        }
    }

    if (!$idBloqueador || !$idBloqueado) {
        http_response_code(404);
        echo json_encode(["message" => "Uno o ambos usuarios no fueron encontrados."]);
        exit;
    }

    $checkBloqueoQuery = "SELECT * FROM Bloqueos WHERE usuario_bloqueador = :id_bloqueador AND usuario_bloqueado = :id_bloqueado";
    $checkBloqueoStmt = $pdo->prepare($checkBloqueoQuery);
    $checkBloqueoStmt->bindParam(":id_bloqueador", $idBloqueador, PDO::PARAM_INT);
    $checkBloqueoStmt->bindParam(":id_bloqueado", $idBloqueado, PDO::PARAM_INT);
    $checkBloqueoStmt->execute();
    $bloqueoExistente = $checkBloqueoStmt->fetch(PDO::FETCH_ASSOC);

    if ($bloqueoExistente) {
        $eliminarBloqueoQuery = "DELETE FROM Bloqueos WHERE usuario_bloqueador = :id_bloqueador_delete AND usuario_bloqueado = :id_bloqueado_delete";
        $eliminarBloqueoStmt = $pdo->prepare($eliminarBloqueoQuery);
        $eliminarBloqueoStmt->bindParam(":id_bloqueador_delete", $idBloqueador, PDO::PARAM_INT);
        $eliminarBloqueoStmt->bindParam(":id_bloqueado_delete", $idBloqueado, PDO::PARAM_INT);
        if ($eliminarBloqueoStmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Usuario desbloqueado."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al desbloquear el usuario."]);
        }
    } else {
        $insertarBloqueoQuery = "INSERT INTO Bloqueos (usuario_bloqueador, usuario_bloqueado) VALUES (:id_bloqueador_insert, :id_bloqueado_insert)";
        $insertarBloqueoStmt = $pdo->prepare($insertarBloqueoQuery);
        $insertarBloqueoStmt->bindParam(":id_bloqueador_insert", $idBloqueador, PDO::PARAM_INT);
        $insertarBloqueoStmt->bindParam(":id_bloqueado_insert", $idBloqueado, PDO::PARAM_INT);
        if ($insertarBloqueoStmt->execute()) {
            http_response_code(201);
            echo json_encode(["message" => "Usuario bloqueado."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Error al bloquear el usuario."]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>