<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db_config.php'; 

                             
$upload_dir = '../uploads/'; 
$upload_dir2 = 'uploads/';   

try {
    $titulo = isset($_POST['titulo']) ? mb_convert_encoding($_POST['titulo'], 'UTF-8') : '';
    $descripcion = isset($_POST['descripcion']) ? mb_convert_encoding($_POST['descripcion'], 'UTF-8') : null;
    $categoria = isset($_POST['categoria']) ? mb_convert_encoding($_POST['categoria'], 'UTF-8') : '';
    $direccion = isset($_POST['direccion']) ? mb_convert_encoding($_POST['direccion'], 'UTF-8') : '';
    $fecha_inicio = isset($_POST['fecha_inicio']) ? $_POST['fecha_inicio'] : '';
    $fecha_fin = isset($_POST['fecha_fin']) ? $_POST['fecha_fin'] : '';
    $latitud = isset($_POST['latitud']) ? $_POST['latitud'] : null;
    $longitud = isset($_POST['longitud']) ? $_POST['longitud'] : null;
    $username = isset($_POST['usuario']) ? mb_convert_encoding($_POST['usuario'], 'UTF-8') : null;
    $usuario_creador_id_valor = null;

    if ($username) {
        $query_usuario = "SELECT id FROM Usuarios WHERE usuario = :username";
        $stmt_usuario = $pdo->prepare($query_usuario);
        $stmt_usuario->bindParam(':username', $username);
        $stmt_usuario->execute();

        if ($stmt_usuario->rowCount() > 0) {
            $row_usuario = $stmt_usuario->fetch(PDO::FETCH_ASSOC);
            $usuario_creador_id_valor = $row_usuario['id'];
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se encontró el usuario con el nombre de usuario proporcionado."]);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Nombre de usuario no proporcionado."]);
        exit;
    }

    $imagen_portada = null;
    if (isset($_FILES['imagen_portada']) && $_FILES['imagen_portada']['error'] === UPLOAD_ERR_OK) {
        $file_name = basename($_FILES['imagen_portada']['name']);
        $file_tmp = $_FILES['imagen_portada']['tmp_name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        $allowed_ext = array("jpg", "jpeg", "png");

        if (in_array($file_ext, $allowed_ext)) {
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            $new_file_name = uniqid() . "." . $file_ext;
            $file_path = $upload_dir . $new_file_name;

            if (move_uploaded_file($file_tmp, $file_path)) {
                $imgenport1 = $upload_dir2 . $new_file_name;
                $imagen_portada =  $imgenport1; 
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al subir la imagen de portada."]);
                exit;
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Formato de imagen no válido. Solo se permiten JPG, JPEG y PNG."]);
            exit;
        }
    } elseif (isset($_FILES['imagen_portada']) && $_FILES['imagen_portada']['error'] !== UPLOAD_ERR_NO_FILE) {
        http_response_code(500);
        echo json_encode(["message" => "Error al subir la imagen de portada: " . $_FILES['imagen_portada']['error']]);
        exit;
    }

    if (empty($titulo) || empty($categoria) || empty($direccion) || empty($fecha_inicio) || $usuario_creador_id_valor === null) {
        http_response_code(400);
        echo json_encode(["message" => "Por favor, completa todos los campos obligatorios y proporciona un nombre de usuario válido."]);
        exit;
    }

    $query = "INSERT INTO Eventos (titulo, descripcion, categoria, imagen_portada, direccion, fecha_inicio, fecha_fin, usuario_creador_id, coordenadas, estado_id)
                  VALUES (:titulo, :descripcion, :categoria, :imagen_portada, :direccion, :fecha_inicio, :fecha_fin, :usuario_creador_id, ST_GeomFromText(:coordenadas_point), 1)";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':titulo', $titulo);
    $stmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
    $stmt->bindParam(':categoria', $categoria);
    $stmt->bindParam(':imagen_portada', $imagen_portada, PDO::PARAM_STR); 
    $stmt->bindParam(':direccion', $direccion);
    $stmt->bindParam(':fecha_inicio', $fecha_inicio);
    $stmt->bindParam(':fecha_fin', $fecha_fin);
    $stmt->bindParam(':usuario_creador_id', $usuario_creador_id_valor, PDO::PARAM_INT);

    $coordenadas_point_string = null;
    if ($latitud !== null && $longitud !== null) {
        $coordenadas_point_string = "POINT(" . $longitud . " " . $latitud . ")";
    }
    $stmt->bindParam(':coordenadas_point', $coordenadas_point_string, PDO::PARAM_STR);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Evento creado exitosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al crear el evento: " . $stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de base de datos: " . $e->getMessage()]);
}
?>