<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once '../db_config.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['username'])) {
        http_response_code(400);
        echo json_encode(["message" => "Se requiere el nombre de usuario."]);
        exit;
    }

    $username = filter_var($data['username'], FILTER_SANITIZE_STRING);

    $queryUsuario = "SELECT id FROM Usuarios WHERE usuario = :username";
    $stmtUsuario = $pdo->prepare($queryUsuario);
    $stmtUsuario->bindParam(":username", $username, PDO::PARAM_STR);
    $stmtUsuario->execute();
    $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        http_response_code(404);
        echo json_encode(["message" => "Usuario no encontrado."]);
        exit;
    }

    $userId = $usuario['id'];

    $stmt = $pdo->prepare("SELECT
                                evt.id,
                                evt.titulo,
                                evt.descripcion,
                                evt.categoria,
                                evt.imagen_portada,
                                evt.direccion,
                                evt.fecha_creacion,
                                evt.fecha_inicio,
                                evt.fecha_fin,
                                evt.usuario_creador_id,
                                evt.estado_id,
                                e.nombre AS nombre_estado
                            FROM
                                Eventos AS evt
                            INNER JOIN
                                EstadosEvento AS e ON e.id = evt.estado_id
                            WHERE
                                evt.estado_id = 3
                                AND evt.usuario_creador_id NOT IN (
                                    SELECT
                                        b.usuario_bloqueador
                                    FROM
                                        Bloqueos AS b
                                    WHERE
                                        b.usuario_bloqueado = :usuario_id_param
                                )
                            ORDER BY
                                evt.fecha_creacion DESC");

    $stmt->bindParam(":usuario_id_param", $userId, PDO::PARAM_INT);
    $stmt->execute();
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formattedEventos = array();
    foreach ($eventos as $evento) {
        $formattedEventos[] = array(
            "id" => (int)$evento['id'],
            "titulo" => $evento['titulo'],
            "descripcion" => $evento['descripcion'],
            "categoria" => $evento['categoria'],
            "imagen_portada" => BASE_URL .  $evento['imagen_portada'],
            "direccion" => $evento['direccion'],
            "fecha_creacion" => $evento['fecha_creacion'],
            "fecha_inicio" => $evento['fecha_inicio'],
            "fecha_fin" => $evento['fecha_fin'],
            "usuario_creador_id" => (int)$evento['usuario_creador_id'],
            "estado_id" => (int)$evento['estado_id'],
            "nombre_estado" => $evento['nombre_estado']
        );
    }

    echo json_encode($formattedEventos);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener los eventos: " . $e->getMessage()]);
}
?>