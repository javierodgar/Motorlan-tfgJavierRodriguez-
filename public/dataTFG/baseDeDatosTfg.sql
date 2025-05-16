-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS RegistroUsuarios;

-- Usar la base de datos recién creada
USE RegistroUsuarios;

-- Crear la tabla Usuarios con los campos solicitados
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- ID único autoincremental como clave primaria
    usuario VARCHAR(50) NOT NULL UNIQUE,        -- Nombre de usuario, único y obligatorio
    nombre VARCHAR(50) NOT NULL,                -- Nombre, obligatorio
    apellido1 VARCHAR(50) NOT NULL,             -- Primer apellido, obligatorio
    apellido2 VARCHAR(50),                      -- Segundo apellido, opcional
    correo_electronico VARCHAR(100) NOT NULL UNIQUE, -- Correo electrónico, único y obligatorio
    ciudad_residencia VARCHAR(50) NOT NULL,     -- Ciudad de residencia, obligatorio
    contrasena VARCHAR(255) NOT NULL,           -- Contraseña, obligatorio (se usa 255 para permitir hash)
    profile_image VARCHAR(255) DEFAULT NULL,    -- Nuevo campo para la foto de perfil
    valoracion_global DECIMAL(4, 3) DEFAULT 3.000, -- Campo para la valoración global de un usuario
    cof VARCHAR(255) DEFAULT 'a' NOT NULL,      -- Campo ajustado a la base 2
    dni VARCHAR(20) NOT NULL UNIQUE             -- Campo para el DNI, único y obligatorio
);

-- Crear la tabla usernameChangeLog (encargada de la gestion de cambio de usuario)
CREATE TABLE IF NOT EXISTS usernameChangeLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    old_username VARCHAR(50) NOT NULL,
    new_username VARCHAR(50) NOT NULL,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reverted BOOLEAN DEFAULT FALSE,
    reverted_date TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Crear la tabla Publicaciones
CREATE TABLE IF NOT EXISTS Publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,              -- ID único, clave primaria
    usuario VARCHAR(50) NOT NULL,                   -- Referencia al usuario que creó la publicación
    imagen VARCHAR(255),                            -- Ruta o nombre de la imagen (opcional)
    titulo VARCHAR(100) NOT NULL,                   -- Título de la publicación
    texto TEXT NOT NULL,                            -- Contenido de la publicación (muy largo)
    hashtags VARCHAR(255),                          -- Hashtags separados por comas
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación (automática)
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario) ON DELETE CASCADE -- Clave foránea
);

-- Crear la tabla LikesDislikes
CREATE TABLE IF NOT EXISTS LikesDislikes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    -- Restricción para asegurar que un usuario solo pueda tener un like o dislike por publicación
    UNIQUE KEY unique_like_dislike (publicacion_id, usuario_id)
);

-- Crear la tabla Seguidores
CREATE TABLE IF NOT EXISTS Seguidores (
    seguidor VARCHAR(50) NOT NULL,
    seguido VARCHAR(50) NOT NULL,
    PRIMARY KEY (seguidor, seguido),
    KEY seguido (seguido)
);

-- Crear la tabla Bloqueos sin un ID único, usando la combinación de usuarios como clave primaria
CREATE TABLE IF NOT EXISTS Bloqueos (
    usuario_bloqueador VARCHAR(50) NOT NULL,     -- Usuario que realiza el bloqueo
    usuario_bloqueado VARCHAR(50) NOT NULL,      -- Usuario que es bloqueado
    fecha_bloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora en la que se realiza el bloqueo
    PRIMARY KEY (usuario_bloqueador, usuario_bloqueado), -- Clave primaria compuesta
    FOREIGN KEY (usuario_bloqueador) REFERENCES Usuarios(usuario) ON DELETE CASCADE, -- Relación con la tabla Usuarios
    FOREIGN KEY (usuario_bloqueado) REFERENCES Usuarios(usuario) ON DELETE CASCADE  -- Relación con la tabla Usuarios
);

-- Crear la tabla Comentarios
CREATE TABLE IF NOT EXISTS Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id int NOT NULL,                  -- Campo ajustado a la base 2
    texto TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,      -- Campo ajustado a la base 2
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Crear la tabla Hashtags
CREATE TABLE IF NOT EXISTS Hashtags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Crear la tabla de relación PublicacionHashtag
CREATE TABLE IF NOT EXISTS PublicacionHashtag (
    publicacion_id INT NOT NULL,
    hashtag_id INT NOT NULL,
    PRIMARY KEY (publicacion_id, hashtag_id),
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);

-- Tabla de Eventos (ajustada a la primera versión para estado_id)
CREATE TABLE IF NOT EXISTS Eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    imagen_portada VARCHAR(255),
    direccion VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin VARCHAR(255) NOT NULL,              -- Almacenado como STRING para la API de mapas
    usuario_creador_id INT NOT NULL,
    coordenadas POINT,
    estado_id INT default 1,                                -- Campo ajustado a la primera versión
    FOREIGN KEY (usuario_creador_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES EstadosEvento(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Crear la tabla InscripcionesEventos
CREATE TABLE IF NOT EXISTS InscripcionesEventos (
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (evento_id, usuario_id),          -- Un usuario solo puede inscribirse una vez al mismo evento
    FOREIGN KEY (evento_id) REFERENCES Eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Crear la tabla ComentariosEventos
CREATE TABLE IF NOT EXISTS ComentariosEventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES Eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Crear la tabla LikesDislikesEventos
CREATE TABLE IF NOT EXISTS LikesDislikesEventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES Eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like_dislike_evento (evento_id, usuario_id) -- Un usuario solo puede dar un like/dislike por evento
);

-- Crear la tabla EstadosEvento
CREATE TABLE IF NOT EXISTS EstadosEvento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE -- Nombre del estado (ej: "Borrador", "Publicado", "Cancelado", "Finalizado")
);

-- Insertar estados predefinidos para los eventos
INSERT INTO EstadosEvento (id, nombre) VALUES (1, 'Creado');
INSERT INTO EstadosEvento (id, nombre) VALUES (2, 'En Proceso');
INSERT INTO EstadosEvento (id, nombre) VALUES (3, 'Finalizado');
INSERT INTO EstadosEvento (id, nombre) VALUES (4, 'Cancelado');

-- ################################################################################################
-- ###################### TABLAS PARA LA GESTIÓN DE VALORACIONES DE USUARIOS ######################
-- ################################################################################################

CREATE TABLE IF NOT EXISTS ValoracionesLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_valorador_id INT NOT NULL,
    usuario_valorado_id INT NOT NULL,
    tipo_valoracion ENUM('bueno', 'malo') NOT NULL,
    fecha_valoracion DATE NOT NULL,
    FOREIGN KEY (usuario_valorador_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (usuario_valorado_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

select * from eventos;
select * from usuarios;