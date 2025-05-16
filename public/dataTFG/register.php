<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8"); 
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


require_once 'db_config.php';

try {

    $username = $_POST['username'] ?? null;
    $firstName = $_POST['firstName'] ?? null;
    $lastName1 = $_POST['lastName'] ?? null;
    $lastName2 = $_POST['lastName2'] ?? null;
    $dni = $_POST['dni'] ?? null;
    $city = $_POST['city'] ?? null;
    $email = $_POST['email'] ?? null;
    $encryptedPassword = $_POST['encryptedPassword'] ?? null;


    if (empty($username) || empty($firstName) || empty($lastName1) || empty($dni) || empty($city) || empty($email) || empty($encryptedPassword)) {
        http_response_code(400);
        echo json_encode(["message" => "Error: Todos los campos obligatorios deben estar completos"]);
        exit;
    }

    $stmtDni = $pdo->prepare("SELECT id FROM Usuarios WHERE dni = :dni");
    $stmtDni->bindParam(":dni", $dni);
    $stmtDni->execute();
    if ($stmtDni->fetch()) {
        http_response_code(409);
        echo json_encode(["message" => "Error: El DNI ya está registrado"]);
        exit;
    }

    $stmtUsername = $pdo->prepare("SELECT id FROM Usuarios WHERE usuario = :username");
    $stmtUsername->bindParam(":username", $username);
    $stmtUsername->execute();
    if ($stmtUsername->fetch()) {
        http_response_code(409);
        echo json_encode(["message" => "Error: El nombre de usuario ya está en uso"]);
        exit;
    }

    $stmtReservado = $pdo->prepare("select count(id) from usernameChangeLog where old_username = :old_username and change_date >= CURDATE() - INTERVAL 30 DAY and reverted = 0");
    $stmtReservado->bindParam(":old_username", $username);
    $stmtReservado->execute();
    if ($stmtReservado->fetchColumn() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(["message" => "El nombre de usuario se encuentre reservado por un cambio reciente"]);
        exit;
    }

    $stmtEmail = $pdo->prepare("SELECT id FROM Usuarios WHERE correo_electronico = :email");
    $stmtEmail->bindParam(":email", $email);
    $stmtEmail->execute();
    if ($stmtEmail->fetch()) {
        http_response_code(409);
        echo json_encode(["message" => "Error: El correo electrónico ya está registrado"]);
        exit;
    }

    $profileImageName = null;
    $profileImageUrl = null;

    if (isset($_FILES['profileImage']) && $_FILES['profileImage']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $fileName = basename($_FILES['profileImage']['name']);
        $uniqueFileName = uniqid() . '_' . $fileName;
        $targetFilePath = $uploadDir . $uniqueFileName;

        $imageFileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));
        $allowedExtensions = array("jpg", "jpeg", "png", "gif");
        if (in_array($imageFileType, $allowedExtensions)) {
            if (move_uploaded_file($_FILES['profileImage']['tmp_name'], $targetFilePath)) {
                $profileImageName = $uniqueFileName;
                $profileImageUrl =  $targetFilePath; 
            } else {
                http_response_code(500);
                echo json_encode(["message" => "Error al subir la imagen de perfil."]);
                exit;
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error: Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF)."]);
            exit;
        }
    }

    $stmt = $pdo->prepare("INSERT INTO Usuarios (usuario, nombre, apellido1, apellido2, correo_electronico, ciudad_residencia, contrasena, profile_image, cof, dni) VALUES (:username, :firstName, :lastName1, :lastName2, :email, :city, :encryptedPassword, :profileImage, :cof, :dni)");
    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":firstName", $firstName);
    $stmt->bindParam(":lastName1", $lastName1);
    $stmt->bindParam(":lastName2", $lastName2);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":city", $city);
    $stmt->bindParam(":encryptedPassword", $encryptedPassword);
    $stmt->bindParam(":profileImage", $profileImageUrl); 
    $stmt->bindParam(":cof", $username);
    $stmt->bindParam(":dni", $dni);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Usuario registrado exitosamente"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error al registrar el usuario: " . $stmt->errorInfo()[2]]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error en el servidor: " . $e->getMessage()]);
}
?>