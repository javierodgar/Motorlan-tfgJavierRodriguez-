-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS RegistroUsuarios;


USE RegistroUsuarios;

-- Crear la tabla Usuarios con los campos solicitados
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,          
    usuario VARCHAR(50) NOT NULL UNIQUE,        
    nombre VARCHAR(50) NOT NULL,                
    apellido1 VARCHAR(50) NOT NULL,             
    apellido2 VARCHAR(50),                      
    correo_electronico VARCHAR(100) NOT NULL UNIQUE, 
    ciudad_residencia VARCHAR(50) NOT NULL,     
    contrasena VARCHAR(255) NOT NULL,           
    profile_image VARCHAR(255) DEFAULT NULL,     
    valoracion_global DECIMAL(4, 3) DEFAULT 3.000, 
    cof VARCHAR(255) DEFAULT 'a' NOT NULL,      
    dni VARCHAR(20) NOT NULL UNIQUE             
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
    id INT AUTO_INCREMENT PRIMARY KEY,              
    usuario VARCHAR(50) NOT NULL,                   
    imagen VARCHAR(255),                            
    titulo VARCHAR(100) NOT NULL,                   
    texto TEXT NOT NULL,                            
    hashtags VARCHAR(255),                          
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario) ON DELETE CASCADE 
);

-- Crear la tabla LikesDislikes
CREATE TABLE IF NOT EXISTS LikesDislikes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('like', 'dislike') NOT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publicacion_id) REFERENCES Publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
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
    usuario_bloqueador VARCHAR(50) NOT NULL,
    usuario_bloqueado VARCHAR(50) NOT NULL, 
    fecha_bloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    PRIMARY KEY (usuario_bloqueador, usuario_bloqueado), 
    FOREIGN KEY (usuario_bloqueador) REFERENCES Usuarios(usuario) ON DELETE CASCADE, 
    FOREIGN KEY (usuario_bloqueado) REFERENCES Usuarios(usuario) ON DELETE CASCADE  
);

-- Crear la tabla Comentarios
CREATE TABLE IF NOT EXISTS Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id int NOT NULL,                  
    texto TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,      
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

-- tabla EstadosEvento
CREATE TABLE IF NOT EXISTS EstadosEvento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE 
);

-- Tabla de Eventos 
CREATE TABLE IF NOT EXISTS Eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    imagen_portada VARCHAR(255),
    direccion VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin VARCHAR(255) NOT NULL,              
    usuario_creador_id INT NOT NULL,
    coordenadas POINT,
    estado_id INT default 1,                                
    FOREIGN KEY (usuario_creador_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES EstadosEvento(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Crear la tabla InscripcionesEventos
CREATE TABLE IF NOT EXISTS InscripcionesEventos (
    evento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (evento_id, usuario_id),          
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
    UNIQUE KEY unique_like_dislike_evento (evento_id, usuario_id) 
);



-- tabla de valoraciones
CREATE TABLE IF NOT EXISTS ValoracionesLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_valorador_id INT NOT NULL,
    usuario_valorado_id INT NOT NULL,
    tipo_valoracion ENUM('bueno', 'malo') NOT NULL,
    fecha_valoracion DATE NOT NULL,
    FOREIGN KEY (usuario_valorador_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (usuario_valorado_id) REFERENCES Usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

--estados evento
INSERT INTO EstadosEvento (id, nombre) VALUES (1, 'Creado');
INSERT INTO EstadosEvento (id, nombre) VALUES (2, 'En Proceso');
INSERT INTO EstadosEvento (id, nombre) VALUES (3, 'Finalizado');
INSERT INTO EstadosEvento (id, nombre) VALUES (4, 'Cancelado');
