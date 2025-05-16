import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MapaComponent } from '../mapa/mapa.component';
import { LatLng } from 'leaflet';
import { ServiciosService } from '../../servicios.service';
import { ModalAdminEventoComponent } from '../modal-admin-evento/modal-admin-evento.component';
import { FormsModule } from '@angular/forms';
import { ConfirmationComponent } from '../../confirmation/confirmation.component';
import { PalabrasProhibidasService } from '../../palabras-prohibidas.service';
import { tap, switchMap, catchError, of, firstValueFrom  } from 'rxjs';
import { AlertComponent } from '../../alert/alert.component';
import { TraduccionesService } from '../../traducciones.service';

@Component({
    selector: 'app-evento-detalle',
    standalone: true,
    imports: [CommonModule, DatePipe, MapaComponent, ModalAdminEventoComponent, FormsModule, ConfirmationComponent, AlertComponent], 
    templateUrl: './evento-detalle.component.html',
    styleUrls: ['./evento-detalle.component.css'],
})
export class EventoDetalleComponent implements OnInit, OnDestroy {
    evento: any;
    eventoId: number = 0;
    estado_id: number = 0;
    loggedInUsername: any;
    userIdLogueado: number | null = null;
    private readonly destroy$ = new Subject<void>();
    eventoCoords: LatLng = new LatLng(41.619819091543846, -4.759047446744906);
    esCreador: boolean = false;
    mostrarModalAdmin: boolean = false;
    mensajeRecibido: string = '';
    nuevoComentario: string = '';
    comentarios: any[] = [];
    valoracionUsuarioLogeado: number = 0; 

    commentBeingEditedId: number | null = null;
    editText: string = '';
    
    showConfirmationDialog: boolean = false;
    confirmMessage: string = '¿Estás seguro de que deseas eliminar este comentario?';
    confirmButtonText: string = 'Eliminar';
    cancelButtonText: string = 'Cancelar';
    commentToDeleteId: number | null = null;

    showConfirmationDialog2: boolean = false;
    confirmMessage2: string = '';
    confirmButtonText2: string = 'Continuar';
    cancelButtonText2: string = 'Cancelar';
    fechaFin: string = '';

    showAlert: boolean = false;
    alertText: string = '';
    alertColor: string = 'red';

    textosDetalleEvento: any = {}; 
    idiomaActual: string = 'es'; 

    constructor(
        private route: ActivatedRoute,
        private serviciosService: ServiciosEventosService,
        private servicioGeneral: ServiciosService,
        private cdr: ChangeDetectorRef,
        private offensiveWordChecker: PalabrasProhibidasService,
        private traduccionesService: TraduccionesService,
        private router: Router
    ) { }

    goToPerfil(id: number) {
      this.router.navigate(['main/user_general', id]);
    }

    cargarTextosDetalleEvento(nombreArchivo: string) {
      this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
        data => {
          this.textosDetalleEvento = data[this.idiomaActual];
        },
        error => {
          console.error('Error al cargar los textos de detalle del evento', error);
        }
      );
    }
  
    cambiarIdioma(idioma: string) {
      this.idiomaActual = idioma;
      this.cargarTextosDetalleEvento('texto_evento_detalle');
    }

    actualizar(datosRecibidos: any) {
        console.log('Función actualizar() disparada con los datos:', datosRecibidos);
        this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
        this.mensajeRecibido = datosRecibidos ? datosRecibidos.mensaje : 'Evento actualizado';
        this.cdr.detectChanges();
    }

    ngOnInit(): void {
        this.idiomaActual = this.getCookie('lang') || 'es';
        this.loggedInUsername = this.getCookie('username');
        this.cargarTextosDetalleEvento('texto_evento_detalle');
        this.valoracionUsuarioLogeado = parseInt(this.getCookie('valoracionUsuario') || '0');
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.eventoId = +params['id'];
            this.obtenerIdUsuarioLogueado(this.loggedInUsername);
            this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
            this.cargarComentariosEvento(this.eventoId);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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

    private setCookie(name: string, value: string, days: number): void {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${name}=${value}; ${expires}; path=/`;
    }

    async cargarDetalleEvento(id: number, username: string | null) {
      if (username) {
        try {
          const data = await firstValueFrom(this.serviciosService.obtenerEventoDetalle(id, username).pipe(takeUntil(this.destroy$)));
          console.log('data en cargarDetalleEvento: ', data);
          this.evento = data;
          this.setCookie('estado_id', data.estado_id, 1);
          this.estado_id = data.estado_id;
          console.log('Detalle del evento:', this.evento);
          this.actualizarCoordenadas();
          this.verificarCreador();
        } catch (error) {
          console.error('Error al cargar el detalle del evento:', error);
        }
      } else {
        console.warn('No se ha definido el nombre de usuario.');
      }
    }

    actualizarCoordenadas(): void {
        if (this.evento && this.evento.latitud !== null && this.evento.longitud !== null) {
            this.eventoCoords = new LatLng(parseFloat(this.evento.longitud), parseFloat(this.evento.latitud));
            console.log('Coordenadas del evento actualizadas:', this.eventoCoords);
        } else {
            console.warn('No se recibieron latitud o longitud válidas del backend, manteniendo las coordenadas iniciales.');
        }
    }

    obtenerIdUsuarioLogueado(nombreUsuario: string): void {
        this.servicioGeneral.getUserIdByUsername(nombreUsuario).pipe(takeUntil(this.destroy$)).subscribe(
            (response) => {
                this.userIdLogueado = response.id;
                console.log('ID del usuario logueado:', this.userIdLogueado);
            },
            (error) => {
                console.error('Error al obtener el ID del usuario logueado:', error);
                this.userIdLogueado = null;
            }
        );
    }

    verificarCreador(): void {
        this.esCreador = this.evento && this.evento.usuario_creador_id == this.userIdLogueado;
        console.log('ID del creador del evento:', this.evento ? this.evento.usuario_creador_id : null);
        console.log('ID del usuario logueado:', this.userIdLogueado);
        console.log('Es creador del evento:', this.esCreador);
    }

    mostrarPepinillo(): void {
        console.log('pepinillo');
        this.mostrarModalAdmin = true;
    }

    darLike() {
        if (this.loggedInUsername) {
            this.serviciosService.gestionarLikeDislike(this.eventoId, 'like', this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
                (response) => {
                    console.log('Respuesta del like:', response);
                    this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
                },
                (error) => {
                    console.error('Error al dar like:', error);
                }
            );
        } else {
            console.warn('Debes estar logueado para dar like.');
        }
    }

    darDislike() {
        if (this.loggedInUsername) {
            this.serviciosService.gestionarLikeDislike(this.eventoId, 'dislike', this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
                (response) => {
                    console.log('Respuesta del dislike:', response);
                    this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
                },
                (error) => {
                    console.error('Error al dar dislike:', error);
                }
            );
        } else {
            console.warn('Debes estar logueado para dar dislike.');
        }
    }
    confirmInscripcion(estado: number, fecha_fin: string) {
      if(estado == 2){
        this.fechaFin = fecha_fin;
        this.confirmMessage2 = this.textosDetalleEvento['eventoIniciado'];
        this.showConfirmationDialog2 = true;
      } else {
        this.inscribirse(estado, fecha_fin);
      }
    }

    onConfirmationResultInscription(confirmed: boolean): void {
        this.showConfirmationDialog2 = false;
        if (confirmed) {
            this.inscribirse(this.estado_id, this.fechaFin);
        } 
    }


    inscribirse(estado: number, fecha_fin: string) {
    
      
        if (this.loggedInUsername) {
          if(this.valoracionUsuarioLogeado >= 3.999){
            this.serviciosService.inscribirseEvento(this.eventoId, this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
            (response) => {
              console.log('Respuesta de inscripción:', response);
              this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
            },
            (error) => {
              console.error('Error al inscribirse:', error);
            }
          );
          } else {
            console.warn('No puedes inscribirte si no tienes una valoración de 4 o superior.');
          }
        } else {
          console.warn('Debes estar logueado para inscribirte.');
        }
      
    }
  
    desinscribirse() {
      if (this.loggedInUsername) {
        this.serviciosService.desinscribirseEvento(this.eventoId, this.loggedInUsername).pipe(takeUntil(this.destroy$)).subscribe(
          (response) => {
            console.log('Respuesta de desinscripción:', response);
            this.cargarDetalleEvento(this.eventoId, this.loggedInUsername);
          },
          (error) => {
            console.error('Error al desinscribirse:', error);
          }
        );
      } else {
        console.warn('Debes estar logueado para desinscribirse.');
      }
    }
  

    get usuarioLogueadoId(): boolean {
        return !!this.loggedInUsername;
    }

    cargarComentariosEvento(eventoId: number) {
        this.serviciosService.obtenerComentariosEvento(eventoId).pipe(takeUntil(this.destroy$)).subscribe(
            (data) => {
                this.comentarios = data;
                console.log('Comentarios del evento:', this.comentarios);
            },
            (error) => {
                console.error('Error al cargar los comentarios:', error);
            }
        );
    }

    agregarComentario() {
        this.showAlert = false; 
        const commentText = this.nuevoComentario.trim();
        if (this.loggedInUsername && this.userIdLogueado && commentText !== '') {
          this.offensiveWordChecker.containsOffensiveWord(commentText).pipe(
            tap(isOffensive => {
              if (isOffensive) {
                this.showAlert = true;
                this.alertText = 'El comentario contiene palabras ofensivas. Por favor, revísalo.';
                this.alertColor = 'red';
                setTimeout(() => {
                  this.showAlert = false;
                }, 3000);
                throw new Error('Contenido ofensivo detectado');
              }
            }),
            switchMap(isOffensive => {
              if (!isOffensive) {
                return this.serviciosService.agregarComentarioEvento(this.eventoId, this.userIdLogueado!, commentText);
              } else {
                return of(null); 
              }
            }),
            catchError(error => {
              if (error?.message === 'Contenido ofensivo detectado') {
                return of(null);
              }
              console.error('Error al agregar el comentario:', error);
              this.showAlert = true;
              this.alertText = 'Error al agregar el comentario.';
              this.alertColor = 'red';
              setTimeout(() => {
                this.showAlert = false;
              }, 3000);
              return of(null);
            })
          ).subscribe(
            (response) => {
              if (response) {
                console.log('Comentario agregado:', response);
                this.nuevoComentario = '';
                this.cargarComentariosEvento(this.eventoId);
              }
            },
            (error) => {
              if (error?.message !== 'Contenido ofensivo detectado') {
                console.error('Error en la suscripción al agregar el comentario:', error);
              }
            }
          );
        } else {
          this.showAlert = true;
          this.alertText = 'Debes estar logueado y escribir un comentario.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        }
      }

    confirmDeleteCommentEvento(commentId: number): void {
        console.log('ID del comentario a borrar:', commentId);
        this.commentToDeleteId = commentId;
        this.showConfirmationDialog = true;
    }

    onConfirmationResult(confirmed: boolean): void {
        this.showConfirmationDialog = false;
        if (confirmed && this.commentToDeleteId) {
            this.deleteCommentEvento(this.commentToDeleteId);
            this.commentToDeleteId = null;
        } else {
            this.commentToDeleteId = null;
        }
    }

    deleteCommentEvento(commentId: number): void {
        this.serviciosService.deleteCommentEvento(commentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    console.log('Comentario borrado:', response);
                    this.cargarComentariosEvento(this.eventoId);
                },
                error: (error) => {
                    console.error('Error al borrar el comentario:', error);
                    this.cargarComentariosEvento(this.eventoId);
                }
            });
    }

    enableEditComment(commentId: number, commentText: string): void {
        this.commentBeingEditedId = commentId;
        this.editText = commentText;
    }

    cancelEditComment(): void {
        this.commentBeingEditedId = null;
        this.editText = '';
    }

    saveEditedComment(commentId: number): void {
        this.showAlert = false; 
        const editTextTrimmed = this.editText.trim();
        if (editTextTrimmed !== '') {
          this.offensiveWordChecker.containsOffensiveWord(editTextTrimmed).pipe(
            tap(isOffensive => {
              if (isOffensive) {
                this.showAlert = true;
                this.alertText = 'El comentario contiene palabras ofensivas. Por favor, revísalo.';
                this.alertColor = 'red';
                setTimeout(() => {
                  this.showAlert = false;
                }, 3000);
                throw new Error('Contenido ofensivo detectado');
              }
            }),
            switchMap(isOffensive => {
              if (!isOffensive) {
                return this.serviciosService.updateCommentEvento(this.eventoId, commentId, editTextTrimmed);
              } else {
                return of(null); 
              }
            }),
            catchError(error => {
              if (error?.message === 'Contenido ofensivo detectado') {
                return of(null); 
              }
              console.error('Error al editar el comentario:', error);
              this.showAlert = true;
              this.alertText = 'Error al editar el comentario.';
              this.alertColor = 'red';
              setTimeout(() => {
                this.showAlert = false;
              }, 3000);
              return of(null);
            })
          ).subscribe({
            next: (response) => {
              if (response) {
                console.log('Comentario editado:', response);
                this.cargarComentariosEvento(this.eventoId);
                this.cancelEditComment(); 
              }
            },
            error: (error) => {
              if (error?.message !== 'Contenido ofensivo detectado') {
                console.error('Error en la suscripción de la edición del comentario:', error);
              }
            }
          });
        } else {
          console.warn('El comentario no puede estar vacío.');
          this.showAlert = true;
          this.alertText = 'El comentario no puede estar vacío.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        }
      }
}