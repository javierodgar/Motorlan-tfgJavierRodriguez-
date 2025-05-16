export interface Evento {
    id?: number;
    titulo: string;
    descripcion?: string;
    categoria: string;
    imagen_portada?: string | File;
    direccion: string;
    fecha_inicio: string;
    fecha_fin: string;
    latitud: number;
    longitud: number;
    estado_id?: number;
    image_preview?: string;

    obtenerCoordenadas(): { lat: number; lng: number };
}

