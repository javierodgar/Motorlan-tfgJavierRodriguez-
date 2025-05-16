import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento } from './evento';



@Injectable({
  providedIn: 'root'
})
export class ServiciosEventosService {
  private baseUrl = 'http://localhost/dataTFG/eventos/'; 
//private baseUrl = '/dataTFG/eventos/'; // Reemplaza con la URL base de tu backend
  constructor(private http: HttpClient) { }

  obtenerEventos(username: string): Observable<Evento[]> {
    const body = { username: username }; // Enviar como objeto JSON
    return this.http.post<Evento[]>(`${this.baseUrl}obtener_eventos.php`, body);
  }

  obtenerEventosFinalizados(username: string): Observable<Evento[]> {
    return this.http.post<Evento[]>(`${this.baseUrl}obtener_eventos_finalizados.php`, { username: username });
  }

  obtenerEventoPorId(id: number): Observable<Evento> {
    const url = `${this.baseUrl}obtener_evento2.php?id=${id}`;
    return this.http.get<Evento>(url);
  }

  actualizarEvento(id: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}actualizar_evento.php?id=${id}`, formData);
  }

  // actualizarEvento(id: number, evento: any): Observable<any> {
  //   const url = `${this.baseUrl}actualizar_evento.php?id=${id}`;
  //   return this.http.put<any>(url, evento);
  // }

  crearEvento(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}crear_evento.php`, formData);
  }

  obtenerEventoDetalle(id: number, username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/obtener_evento.php?id=${id}&username=${username}`);
  }

  obtenerInscritosEvento(eventoId: number): Observable<any[]> {
    const url = `${this.baseUrl}/obtener_inscritos_eventos.php?evento_id=${eventoId}`;
    return this.http.get<any[]>(url);
  }

  eliminarInscritoEvento(eventoId: number, usuarioId: number): Observable<any> {
    const url = `${this.baseUrl}/eliminar_inscrito_evento.php`;
    const body = { evento_id: eventoId, usuario_id: usuarioId };
    return this.http.post(url, body);
  }

  eliminarEvento(eventoId: number): Observable<any> {
    const url = `${this.baseUrl}/eliminar_evento.php`;
    const body = { evento_id: eventoId };
    return this.http.post(url, body);
  }

  obtenerComentariosEvento(eventoId: number): Observable<any[]> {
    const url = `${this.baseUrl}/obtener_comentarios_evento.php?evento_id=${eventoId}`;
    return this.http.get<any[]>(url);
  }

  agregarComentarioEvento(eventoId: number, usuarioId: number, texto: string): Observable<any> {
    const url = `${this.baseUrl}/agregar_comentario_evento.php`;
    const body = { evento_id: eventoId, usuario_id: usuarioId, texto: texto };
    return this.http.post(url, body);
  }

  deleteCommentEvento(comentarioId: number): Observable<any> {
    const params = { comentario_id: comentarioId.toString() };
    return this.http.delete(`${this.baseUrl}eliminar_comentario_evento.php`, { params: params });
  }

  updateCommentEvento(eventoId: number, comentarioId: number, nuevoTexto: string): Observable<any> {
    const body = {
        evento_id: eventoId,
        comentario_id: comentarioId,
        nuevo_texto: nuevoTexto
    };
    return this.http.put(`${this.baseUrl}editar_comentario_evento.php`, body);
  }

  gestionarLikeDislike(eventoId: number, tipo: 'like' | 'dislike', username: string): Observable<any> {
    const body = { evento_id: eventoId, tipo: tipo, username: username };
    return this.http.post(`${this.baseUrl}/gestionar_like_dislike.php`, body);
  }

  inscribirseEvento(eventoId: number, username: string): Observable<any> {
    const body = { evento_id: eventoId, username: username };
    return this.http.post(`${this.baseUrl}/inscribirse_evento.php`, body);
  }

  desinscribirseEvento(eventoId: number, username: string): Observable<any> {
    const body = { evento_id: eventoId, username: username };
    return this.http.post(`${this.baseUrl}/desinscribirse_evento.php`, body);
  }

  editarEvento(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}editar_evento.php`, formData);
  }

  obtenerEventosInscritos(nombreUsuario: string): Observable<any[]> {
    const url = `${this.baseUrl}/obtener_eventos_inscrito.php`;
    return this.http.post<any[]>(url, { usuario: nombreUsuario });
  }

  obtenerEventosInscritosFinalizados(nombreUsuario: string): Observable<any[]> {
    const url = `${this.baseUrl}/obtener_eventos_inscrito_finalizados.php`;
    return this.http.post<any[]>(url, { usuario: nombreUsuario });
  }

  actualizarEstadoEvento(eventoId: number, estadoId: number): Observable<any> {
    const body = new FormData();
    body.append('evento_id', eventoId.toString());
    body.append('estado_id', estadoId.toString());

    return this.http.post(`${this.baseUrl}/actualizar_estado_evento.php`, body);
  }

  actualizarEstadosEventos(): Observable<any> {
    return this.http.get(this.baseUrl + 'actualizar_estados.php');
  }
}
