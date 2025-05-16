import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiciosService } from '../servicios.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ModalAdminPostComponent } from './modal-admin-post/modal-admin-post.component';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { AlertComponent } from '../alert/alert.component';
import { PalabrasProhibidasService } from '../palabras-prohibidas.service';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TraduccionesService } from '../traducciones.service';

@Component({
  selector: 'app-post-coments',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ModalAdminPostComponent, ConfirmationComponent, AlertComponent],
  templateUrl: './post-coments.component.html',
  styleUrl: './post-coments.component.css'
})
export class PostComentsComponent implements OnInit, OnDestroy {
  title='';
  img='';
  text='';
  hastagh: any[] = [];
  coments:any = [];
  likes=0;
  dislikes=0;
  publicacionConComentarios: any;
  publicacionId:any;
  dataUrl = 'http://localhost/dataTFG/';
  errorLoading: boolean = false;
  newCommentText: string = ''; 
  username: any; 
  editingCommentId: number | null = null; 
  editedCommentText: string = ''; 
  showGenericModal: boolean = false; 
  esCreador: boolean = false; 
  usuario: any; 
  profile_image: any;

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red';  
  
  showConfirmationDialog: boolean = false;
  confirmMessage: string = '¿Estas seguro de que deseas Eliminar este comentario';
  confirmButtonText: string = 'Eliminar';
  cancelButtonText: string = 'Cancelar';
  commentToDeleteId: number | null = null;

  textosPostComents: any = {}; 
  idiomaActual: string = 'es'; 

  private routeSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute, 
    private serviciosService: ServiciosService, 
    private offensiveWordChecker: PalabrasProhibidasService,
    private traduccionesService: TraduccionesService,
    private router: Router
  ) {}

  openGenericModal() {
    this.showGenericModal = true;
  }

  recargarPost(){
    this.showGenericModal = false;
    this.loadPublicationDetails();
  }

  cargarTextosPostComents(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosPostComents = data[this.idiomaActual];
        this.confirmMessage = this.textosPostComents['confirmarBorrarComentario'] || '¿Estás seguro de que deseas Eliminar este comentario';
        this.confirmButtonText = this.textosPostComents['eliminarBotonConfirmacion'] || 'Eliminar';
        this.cancelButtonText = this.textosPostComents['cancelarBotonConfirmacion'] || 'Cancelar';
      },
      error => {
        console.error('Error al cargar los textos de post coments', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosPostComents('textos_post_comets');
  }
  
  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosPostComents('textos_post_coments');
    this.username = this.getCookie('username');
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.publicacionId = +idParam; 
        this.loadPublicationDetails();
      }
    });
    
  }
  

  verificarCreador(): void {
    this.esCreador = this.usuario == this.username;
    console.log('Usuario logueado:', this.username);
    console.log('Usuario de la publicación:', this.usuario);
    console.log('Es creador del evento:', this.esCreador);
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadPublicationDetails(): void {
    if (this.publicacionId !== null) {
      this.serviciosService.getPublicationWithComments(this.publicacionId).subscribe(
        (data) => {
          console.log(data);
          this.publicacionConComentarios = data;
          this.title = this.publicacionConComentarios.titulo;
          this.img = this.publicacionConComentarios.imagen;
          this.text = this.publicacionConComentarios.texto;
          this.editingCommentId = null;
          this.usuario = this.publicacionConComentarios.nombre_usuario_publicacion;
          this.profile_image = this.publicacionConComentarios.profile_image;
          
          this.hastagh = this.publicacionConComentarios.hashtags || [];

          this.coments = this.publicacionConComentarios.comentarios || [];
          this.likes = this.publicacionConComentarios.total_likes;
          this.dislikes = this.publicacionConComentarios.total_dislikes;
          this.errorLoading = false;
          this.verificarCreador(); 
        },
        (error) => {
          console.error('Error al cargar la publicación con comentarios:', error);
          this.errorLoading = true;
          this.publicacionConComentarios = null;
        }
      );
      
    }
  }

  confirmDeleteComment(commentId: number): void {
    console.log('ID del comentario a borrar:', commentId);
    this.commentToDeleteId = commentId;
    this.showConfirmationDialog = true;
  }
  
  onConfirmationResult(confirmed: boolean): void {
    this.showConfirmationDialog = false;
    if (confirmed && this.commentToDeleteId) {
      this.deleteComment(this.commentToDeleteId);
      this.commentToDeleteId = null;
    } else {
      this.commentToDeleteId = null;
    }
  }
  
  deleteComment(commentId: number): void {
    this.serviciosService.deleteComment(commentId)
      .subscribe({
        next: (response) => {
          console.log('Comentario borrado:', response);
          this.loadPublicationDetails();
          this.loadPublicationDetails(); 
          this.showAlert = true;
          this.alertText = 'Comentario borrado exitosamente.';
          this.alertColor = 'green'; 
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error al borrar el comentario:', error);
          this.showAlert = true;
          this.alertText = 'Error al borrar el comentario.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        }
      });
  }

  startEdit(comentario: any): void {
    comentario.isEditing = true;
    comentario.editedText = comentario.comentario_texto;
  }

  cancelEdit(comentario: any): void {
    comentario.isEditing = false;
    comentario.editedText = comentario.comentario_texto; 
  }

  saveEditedComment(comentario: any): void {
    this.showAlert = false;
    const editedText = comentario.editedText.trim();
    if (editedText !== '') {
      this.offensiveWordChecker.containsOffensiveWord(editedText).pipe(
        tap(isOffensive => {
          if (isOffensive) {
            this.showAlert = true;
            this.alertText = 'El comentario contiene palabras ofensivas. Por favor, revísalo.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            },3000);
          }
        }),
        switchMap(isOffensive => {
          if (!isOffensive) {
            return this.serviciosService.updateComment(this.publicacionId, comentario.comentario_id, editedText);
          } else {
            return of(null);
          }
        }),
        catchError(error => {
          console.error('Error al verificar o guardar la edición del comentario:', error);
          this.showAlert = true;
          this.alertText = 'Error al actualizar el comentario.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          return of(null);
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            console.log('Comentario actualizado:', response);
            this.loadPublicationDetails(); 
            this.showAlert = true;
            this.alertText = 'Comentario actualizado exitosamente.';
            this.alertColor = 'green'; 
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
            this.cancelEdit(comentario); 
          }
        },
        error: (error) => {
          if (error) {
            console.error('Error en la suscripción de la edición del comentario:', error);
          }
        }
      });
    } else {
      this.showAlert = true;
      this.alertText = 'Por favor, introduce un texto para el comentario.';
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    }
  }

  postComment(): void {
    this.showAlert = false; 
    const commentText = this.newCommentText.trim();
    if (this.publicacionId && this.username && commentText !== '') {
      this.offensiveWordChecker.containsOffensiveWord(commentText).pipe(
        tap(isOffensive => {
          if (isOffensive) {
            this.showAlert = true;
            this.alertText = 'El comentario contiene palabras ofensivas. Por favor, revísalo.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        }),
        switchMap(isOffensive => {
          if (!isOffensive) {
            return this.serviciosService.saveComment(this.publicacionId, this.username!, commentText);
          } else {
            return of(null);
          }
        }),
        catchError(error => {
          console.error('Error al verificar o guardar el comentario:', error);
          this.showAlert = true;
          this.alertText = 'Error al enviar el comentario.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          return of(null);
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            console.log('Comentario enviado:', response);
            this.newCommentText = ''; 
            this.loadPublicationDetails();
          }
        },
        error: (error) => {
          if (error) {
            console.error('Error en la suscripción del comentario:', error);
          }
        }
      });
    } else {
      this.showAlert = true;
      this.alertText = 'Por favor, escribe un comentario.';
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    }
  }

  onLikeButtonClick(): void {
    if (this.publicacionId) {
      this.serviciosService.likeDislikePost(this.publicacionId, this.username, 'like')
        .subscribe({
          next: (response) => {
            console.log('Like:', response);
            this.loadLikesDislikesCount();
          },
          error: (error) => {
            console.error('Error al dar like:', error);
            this.showAlert = true;
            this.alertText = 'Error al dar like.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        });
        
    } else {
      alert('ID de publicación no encontrado.');
      this.showAlert = true;
      this.alertText = 'ID de publicación no encontrado.';
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    }
  }

  onDislikeButtonClick(): void {
    if (this.publicacionId) {
      this.serviciosService.likeDislikePost(this.publicacionId, this.username, 'dislike')
        .subscribe({
          next: (response) => {
            console.log('Dislike:', response);
            this.loadLikesDislikesCount();
          },
          error: (error) => {
            console.error('Error al dar dislike:', error);
            this.showAlert = true;
            this.alertText = 'Error al dar dislike.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        });
        
    } else {
      this.showAlert = true;
      this.alertText = 'Id de publicación no encontrado.';
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
    }
  }

  loadLikesDislikesCount(): void {
    if (this.publicacionId) {
      this.serviciosService.getLikesDislikes(this.publicacionId)
        .subscribe({
          next: (data) => {
            this.likes = data.total_likes || 0;
            this.dislikes = data.total_dislikes || 0;
            console.log('Likes:', this.likes, 'Dislikes:', this.dislikes);
          },
          error: (error) => {
            console.error('Error al cargar los likes/dislikes:', error);
            this.showAlert = true;
            this.alertText = 'Error al cargar los likes/dislikes.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        });
    }
  }

  goToPerfil(id: number) {
    this.router.navigate(['main/user_general', id]);
  }


  /**
   * Gets the value of a cookie with the given name.
   * Returns null if the cookie does not exist.
   * @param name The name of the cookie.
   */
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
  
}
