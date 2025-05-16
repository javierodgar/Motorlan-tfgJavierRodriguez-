import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private baseUrl = 'http://localhost/dataTFG/';
//private baseUrl = '/dataTFG/';
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(nameEQ)) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }

  // Obtener datos del usuario por username usando promesas
  async getUser(username: string): Promise<any> {
    const body = { username };
    try {
      const response = await this.http.post(
        `${this.baseUrl}dataGet.php`,
        body,
        { headers: this.getHeaders() }
      ).toPromise();
      return response;
    } catch (error) {
      console.error('Error en la solicitud:', error);
      return { message: 'Error en la solicitud', error };
    }
  }

  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}register.php`, formData);
  }
  // Nueva función: Obtener publicaciones
  getPosts(page: number = 1, limit: number = 10, usuario_logueado: string | null = null): Observable<any> {
    let url = `${this.baseUrl}get_posts.php?page=${page}&limit=${limit}`;
    if (usuario_logueado) {
      url += `&usuario_logueado=${usuario_logueado}`;
    }
    return this.http.get<any>(url);
  }

  savePost(postData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}save_post.php`, postData); // Sin headers porque FormData maneja el Content-Type automáticamente
  }

  getUserData(username: string): Observable<any> {
    const body = { username };
    return this.http.post(`${this.baseUrl}get_user_data.php`, body, { headers: this.getHeaders() });
  }

  getPublicacionesDestacadas(usuarioLogueado: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/obtener_publicaciones_destacadas.php?usuario=${usuarioLogueado}`);
  }

  getEventosPopulares(usuarioCreadorExcluir: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/obtener_eventos_populares.php?excluir_usuario=${usuarioCreadorExcluir}`);
  }

  updateUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}update_user.php`, userData);
  }

  getProfileImageValoracion(username: string): Observable<any> {
    const body = { username };
    return this.http.post(`${this.baseUrl}get_profile_image.php`, body, { headers: this.getHeaders() });
  }

  getPublicationWithComments(publicacionId: number): Observable<any> {
    const params = { publicacion_id: publicacionId.toString() };
    return this.http.get<any>(`${this.baseUrl}get_post_coments.php`, { params: params, headers: this.getHeaders() });
  }


  getPostById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/obtener_post.php?id=${id}`);
  }

  actualizarPost(id: number, post: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/actualizar_post.php?id=${id}`, post);
  }

  eliminarPost(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/eliminar_post.php?id=${id}`);
  }

  bloquearDesbloquearUsuario(usuarioBloqueador: string, usuarioBloqueado: string): Observable<any> {
    const body = {
      usuario_bloqueador: usuarioBloqueador,
      usuario_bloqueado: usuarioBloqueado
    };
    return this.http.post<any>(`${this.baseUrl}/bloquear.php`, body);
  }

  obtenerRelaciones(usuario: string): Observable<{
    relaciones: {
      siguiendo: { usuario: string; profile_image: string; user_id: number }[];
      bloqueados: { usuario: string; profile_image: string; user_id: number }[];
    };
  }> {
    const body = { usuario: usuario };
    return this.http.post<{
      relaciones: {
        siguiendo: { usuario: string; profile_image: string; user_id: number }[];
        bloqueados: { usuario: string; profile_image: string; user_id: number }[];
      };
    }>(
      `${this.baseUrl}/obtener_seguidos_bloqueados.php`,
      body
    );
  }

  desbloquearUsuario(usuarioBloqueador: string, usuarioABloquear: string): Observable<any> {
    const body = { usuario_bloqueador: usuarioBloqueador, usuario_a_desbloquear: usuarioABloquear };
    return this.http.post(`${this.baseUrl}/desbloquear_usuario.php`, body);
  }

  dejarDeSeguir(usuarioSeguidor: string, usuarioASeguir: string): Observable<any> {
    const body = { usuario_seguidor: usuarioSeguidor, usuario_a_dejar_de_seguir: usuarioASeguir };
    return this.http.post(`${this.baseUrl}/dejar_de_seguir.php`, body);
  }

  saveComment(publicacionId: number, username: string, texto: string): Observable<any> {
    const body = {
      publicacion_id: publicacionId,
      username: username,
      texto: texto
    };
    return this.http.post(`${this.baseUrl}save_comment.php`, body, { headers: this.getHeaders() });
  }

  likeDislikePost(publicacionId: number, username: string, tipo: 'like' | 'dislike'): Observable<any> {
    const body = {
      publicacion_id: publicacionId,
      username: username,
      tipo: tipo
    };
    return this.http.post(`${this.baseUrl}like_dislike_post.php`, body, { headers: this.getHeaders() });
  }

  getLikesDislikes(publicacionId: number): Observable<any> {
    const params = { publicacion_id: publicacionId.toString() };
    return this.http.get<any>(`${this.baseUrl}get_likes_dislikes.php`, { params: params, headers: this.getHeaders() });
  }

  deleteComment(comentarioId: number): Observable<any> {
    const params = { comentario_id: comentarioId.toString() };
    return this.http.delete(`${this.baseUrl}delete_comment.php`, { params: params, headers: this.getHeaders() });
  }

  updateComment(publicacionId: number, comentarioId: number, nuevoTexto: string): Observable<any> {
    const body = {
      publicacion_id: publicacionId,
      comentario_id: comentarioId,
      nuevo_texto: nuevoTexto
    };
    return this.http.put(`${this.baseUrl}update_comment.php`, body, { headers: this.getHeaders() });
  }

  searchPublications(searchTerm: string, sortBy: string = 'default'): Observable<any[]> {
    let url = `${this.baseUrl}search_publications.php?term=${encodeURIComponent(searchTerm)}&sortBy=${sortBy}`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  searchEvents(searchTerm: string): Observable<any[]> {
    let url = `${this.baseUrl}search_events.php?term=${encodeURIComponent(searchTerm)}`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
}

  searchHashtags(searchTerm: string): Observable<any[]> {
    const url = `${this.baseUrl}search_hashtags.php?term=${encodeURIComponent(searchTerm)}`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  getTopHashtags(): Observable<any[]> {
    const url = `${this.baseUrl}search_hashtags.php?term=`; // Para obtener todos y luego ordenar
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  searchUsers(searchTerm: string, user: string): Observable<any[]> {
    const url = `${this.baseUrl}search_users.php?term=${encodeURIComponent(searchTerm)}&user=${encodeURIComponent(user)}`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  //en proceso de depuracion creo que este servicvio no es necesario pero por el momento le mantego
  obtenerImagenPerfil(username: string): Observable<any> {
    return this.http.post(`${this.baseUrl}get_profile_image.php`, { username });
  }

  search(searchTerm: string, filterOptions: string[]): Observable<any> {
    let url = `${this.baseUrl}search.php?term=${encodeURIComponent(searchTerm)}`;
    if (filterOptions && filterOptions.length > 0) {
      url += `&filters=${encodeURIComponent(JSON.stringify(filterOptions))}`;
    }

    return this.http.get(url, { headers: this.getHeaders() });
  }

  getMatchingHashtags(query: string): Observable<any> {
    const url = `${this.baseUrl}get_hashtags.php?query=${encodeURIComponent(query)}`;
    return this.http.get(url);
  }

  getValoracionGlobal(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}valoracion/get_valoracion_global.php?username=${username}`);
  }

  marcarBuenUsuario(username: string): Observable<any> {
    return this.http.post(`${this.baseUrl}valoracion/buen_usuario.php`, { username });
  }

  marcarMalUsuario(username: string): Observable<any> {
    return this.http.post(`${this.baseUrl}valoracion/mal_usuario.php`, { username });
  }

  getPostsByHashtag(hashtag: string): Observable<any[]> {
    const body = { hashtag: hashtag };
    return this.http.post<any[]>(`${this.baseUrl}get_posts_by_hashtag.php`, body, { headers: this.getHeaders() });
  }

  isFollowing(followerUsername: string, followingUsername: string): Observable<any> {
    return this.http.post(`${this.baseUrl}is_following.php`, { follower: followerUsername, followed: followingUsername });
  }

  isBlocked(followerUsername: string, followingUsername: string): Observable<any> {
    return this.http.post(`${this.baseUrl}is_blocked.php`, { follower: followerUsername, followed: followingUsername });
  }

  followUnfollow(followerUsername: string, followingUsername: string): Observable<any> {
    return this.http.post(`${this.baseUrl}follow_unfollow.php`, { follower: followerUsername, followed: followingUsername });
  }

  getUserIdByUsername(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}get_user_id.php?username=${username}`);
  }

  marcarUsuario(usernameValorado: string, tipoValoracion: 'bueno' | 'malo'): Observable<any> {
    const usernameValorador = this.getCookie('username');
    if (!usernameValorador) {
      console.error('Usuario valorador no encontrado.');
      return of({ message: 'Error: Usuario valorador no encontrado.' });
    }
    return this.http.post(this.baseUrl + 'marcar_valoracion.php', {
      username_valorador: usernameValorador,
      username_valorado: usernameValorado,
      tipo_valoracion: tipoValoracion
    });
  }

  updateUserDetails(formData: FormData): Observable<any> {
    return this.http.post(this.baseUrl + 'update_user_details.php', formData);
  }

  updateUserSecurity(data: { usuario: string, usuarioNuevo: string }): Observable<any> {
    return this.http.post(this.baseUrl + 'update_user_username.php', data);
  }

  revertUsername(usernameToRevert: string): Observable<any> {
    const body = { username_to_revert: usernameToRevert };
    return this.http.post(`${this.baseUrl}revert_username_change.php`, body);
  }

  updateUserPassword(data: { usuario: string, newPassword: string }): Observable<any> {
    return this.http.post(this.baseUrl + 'update_user_password.php', data);
  }
    // Nueva función: Registrar usuario
  // async register(username: string, firstName: string, lastName: string, lastName2: string, city: string, email: string, encryptedPassword: string): Promise<any> {
  //   const body = {
  //     username,
  //     firstName,
  //     lastName,
  //     lastName2,
  //     city,
  //     email,
  //     encryptedPassword
  //   };
  //   try {
  //     const response = await this.http.post(
  //       `${this.baseUrl}register.php`,
  //       body,
  //       { headers: this.getHeaders() }
  //     ).toPromise();
  //     return response;
  //   } catch (error) {
  //     console.error('Error en register:', error);
  //     return { message: 'Error en la solicitud', error };
  //   }
  // }
}
