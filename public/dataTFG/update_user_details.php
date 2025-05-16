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
    header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 3600");

require_once 'db_config.php';

try {
    $username = $_POST["usuario"] ?? null;
    $nombre = $_POST["nombre"] ?? null;
    $apellido1 = $_POST["apellido1"] ?? null;
    $apellido2 = $_POST["apellido2"] ?? null;
    $email = $_POST["correo_electronico"] ?? null;
    $ciudad = $_POST["ciudad_residencia"] ?? null;

    if (empty($username) || empty($nombre) || empty($apellido1) || empty($email) || empty($ciudad)) {
        http_response_code(400);
        echo json_encode(["message" => "Faltan datos obligatorios"]);
        exit;
    }

    $profileImage = null;
    if (isset($_FILES["profile_image"]) && $_FILES["profile_image"]["error"] === UPLOAD_ERR_OK) {
        $uploadDir = "uploads/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $imageName = uniqid() . "_" . basename($_FILES["profile_image"]["name"]);
        $profileImage = $uploadDir . $imageName;
        $profileImage2 = $uploadDir . $imageName;
        if (!move_uploaded_file($_FILES["profile_image"]["tmp_name"], $profileImage2)) {
            http_response_code(500);
            echo json_encode(["message" => "Error al subir la imagen de perfil"]);
            exit;
        }
        $profileImage =  $profileImage;
    }  else if (isset($_POST["profile_image_url"]) && !empty($_POST["profile_image_url"])) {

        $profileImage = $_POST["profile_image_url"];
        $profileImage =  ltrim($profileImage, '/');
    } else {
        $stmtOldImage = $pdo->prepare("SELECT profile_image FROM Usuarios WHERE usuario = :username");
        $stmtOldImage->bindParam(":username", $username);
        $stmtOldImage->execute();
        $oldImageResult = $stmtOldImage->fetch(PDO::FETCH_ASSOC);
        $profileImage = $oldImageResult['profile_image'] ?? null;
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

    $stmtEmailCheck = $pdo->prepare("SELECT id FROM Usuarios WHERE correo_electronico = :email AND id != :id_usuario");
    $stmtEmailCheck->bindParam(":email", $email);
    $stmtEmailCheck->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
    $stmtEmailCheck->execute();
    if ($stmtEmailCheck->fetch()) {
        http_response_code(409);
        echo json_encode(["message" => "El correo electrónico ya está en uso por otro usuario"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE Usuarios SET nombre = :nombre, apellido1 = :apellido1, apellido2 = :apellido2, correo_electronico = :email, ciudad_residencia = :ciudad, profile_image = :profileImage WHERE id = :id_usuario");
    $stmt->bindParam(":nombre", $nombre);
    $stmt->bindParam(":apellido1", $apellido1);
    $stmt->bindParam(":apellido2", $apellido2);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":ciudad", $ciudad);
    $stmt->bindParam(":profileImage", $profileImage);
    $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(["message" => "Datos del perfil actualizados exitosamente"]);
        } else {
            http_response_code(200);
            echo json_encode(["message" => "No se realizaron cambios en los datos del perfil"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al actualizar los datos del perfil: " . $stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>