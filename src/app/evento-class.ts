import { Evento } from './evento'; 

export class EventoClase implements Evento {
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

  constructor(
    titulo: string,
    categoria: string,
    direccion: string,
    fecha_inicio: string,
    fecha_fin: string,
    latitud: number,
    longitud: number,
    id?: number,
    descripcion?: string,
    imagen_portada?: string | File,
    estado_id?: number
  ) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.imagen_portada = imagen_portada;
    this.direccion = direccion;
    this.fecha_inicio = fecha_inicio;
    this.fecha_fin = fecha_fin;
    this.latitud = latitud;
    this.longitud = longitud;
    this.estado_id = estado_id;
  }

  obtenerCoordenadas(): { lat: number; lng: number } {
    return { lat: this.latitud, lng: this.longitud };
  }
}