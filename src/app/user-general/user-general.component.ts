import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PostUpdateService } from '../post-update.service';
import { UserEventsGeneralComponent } from './user-events-general/user-events-general.component';
import { UserPostsGeneralComponent } from './user-posts-general/user-posts-general.component';
import { AlertComponent } from '../alert/alert.component';
import { TraduccionesService } from '../traducciones.service';

@Component({
  selector: 'app-user-general',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserEventsGeneralComponent, UserPostsGeneralComponent, AlertComponent],
  templateUrl: './user-general.component.html',
  styleUrl: './user-general.component.css'
})
export class UserGeneralComponent implements OnInit {
  dataUrl = 'http://localhost/dataTFG/';
  userData: any = null;
  posts: any[] = [];
  events: any[] = []; 
  followersCount: number = 0;
  followingCount: number = 0;
  showEditModal: boolean = false;
  username: string | null = null;
  usernameLoggedIn: any = '';
  profileImage: string | null = null;
  valoracionGlobal: number = 0;

  isFollowing: boolean = false; 
  isBlocked: boolean = false;
  
  showPosts: boolean = true;

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red';  

  rutaImagenEstrella: string = '';

  textosPerfilUsuario: any = {}; 
  idiomaActual: string = 'es'; 


  private postUpdateSubscription: Subscription;

  constructor(
    private servicios: ServiciosService,
    private router: Router,
    private route: ActivatedRoute,
    private postUpdateService: PostUpdateService,
    private traduccionesService: TraduccionesService
  ) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => {
      this.loadUserData();
    });
  }

  cargarTextosPerfilUsuario(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosPerfilUsuario = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos del perfil del usuario', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosPerfilUsuario('textos_user_profile_general');
  }

  ngOnInit() {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosPerfilUsuario('textos_user_profile_general');
    this.usernameLoggedIn = this.getCurrentLoggedInUsername();
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username');
      if (!this.username) {
        this.showAlert = true;
        this.alertText = 'No se encontró un nombre de usuario en la ruta. Por favor, verifica la URL.';
        this.alertColor = 'red';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
        this.router.navigate(['/']);
      } else {
        this.loadUserData();
        this.loadProfileImage();
        this.loadValoracionGlobal();
        this.checkIfFollowing();
        this.checkIfBlocked();
        
      }
    });
  }
  obtenerRutaEstrella(valoracion: number): string {
    console.log('Valoración recibida:', valoracion);
  
    if (valoracion <= 0) {
      const imageName = 'estrella0.png';
      console.log('Nombre de la imagen:', imageName);
      return 'dataTFG/icons/estrellas/' + imageName;
    }
    if (valoracion >= 5) {
      const imageName = 'estrella5.png';
      console.log('Nombre de la imagen:', imageName);
      return 'dataTFG/icons/estrellas/' + imageName;
    }
  
    const valorRedondeado = Math.round(valoracion * 2) / 2;
    console.log('Valor redondeado:', valorRedondeado);
  
    let imageName: string;
    const parteEntera = Math.floor(valorRedondeado);
    const esMedio = valorRedondeado % 1 !== 0; 
  
    if (esMedio) {
      imageName = `estrella${parteEntera}-5.png`;
    } else {
      imageName = `estrella${parteEntera}.png`;
    }
  
    console.log('Nombre de la imagen:', imageName);
    return 'dataTFG/icons/estrellas/' + imageName;
  }

  bloqueoFunction( bloqueado: string) {
    if(this.isFollowing === true) {
      this.showAlert = true;
        this.alertText = this.textosPerfilUsuario['cantBlocked'];
        this.alertColor = 'red';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
        return
    }

    this.servicios.bloquearDesbloquearUsuario(this.usernameLoggedIn, bloqueado).subscribe(
      (response) => {
        console.log(response);
        if(response.message === 'Usuario bloqueado.'){
          this.showAlert = true;
        this.alertText = this.textosPerfilUsuario['userBlocked'];
        this.alertColor = 'green';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
        this.checkIfBlocked();
        } else{
          this.showAlert = true;
        this.alertText = this.textosPerfilUsuario['userUnblocked'];
        this.alertColor = 'green';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
        this.checkIfBlocked();
        }
      },
      (error) => {
        this.showAlert = true;
        this.alertText = this.textosPerfilUsuario['blokingError'];
        this.alertColor = 'red';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
      }
    );
  }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  marcarUsuario(tipo: 'bueno' | 'malo') {
    if (this.username) {
      this.servicios.marcarUsuario(this.username, tipo).subscribe({
        next: (response) => {
          console.log(`Usuario marcado como ${tipo}:`, response);
          if (tipo === 'bueno') {
            this.marcarBuenUsuario();
          } else if (tipo === 'malo') {
            this.marcarMalUsuario();
          }
          this.loadValoracionGlobal();
        },
        error: (error) => {
          console.error(`Error al marcar como ${tipo}:`, error);
          if (error.status === 409) {
            this.showAlert = true;
            this.alertText = error.error.message;
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          } else {
            this.showAlert = true;
            this.alertText = 'error al marcar como ' + tipo + '.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        }
      });
    }
  }

  loadPosts() {
  }

  loadUserData() {
    console.log(this.username)
    this.servicios.getUserData(this.username!).subscribe({
      next: (data) => {
        if (data.user) {
          this.userData = data.user;
          this.posts = data.posts;
          this.followersCount = data.followersCount;
          this.followingCount = data.followingCount;
          this.events = data.events || [];
        } else {
          this.userData = null;
          console.log('Usuario no encontrado');
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
      }
    });
  }

  loadProfileImage() {
    this.servicios.getProfileImageValoracion(this.username!).subscribe({
      next: (data) => {
        this.profileImage = data.profile_image || null;
      },
      error: (error) => {
        console.error('Error al cargar la imagen de perfil:', error);
        this.profileImage = null;
      }
    });
  }

  loadValoracionGlobal() {
    if (this.username) {
      this.servicios.getValoracionGlobal(this.username).subscribe({
        next: (data) => {
          this.valoracionGlobal = data.valoracion_global;
          this.rutaImagenEstrella = this.obtenerRutaEstrella(this.valoracionGlobal);
        },
        error: (error) => {
          console.error('Error al cargar la valoración global:', error);
          this.valoracionGlobal = 0; 
        }
      });
    }
  }

  getCurrentLoggedInUsername(): string | null {
    return this.getCookie('username');
  }


checkIfFollowing() {
    const loggedInUsername = this.getCurrentLoggedInUsername();
    if (loggedInUsername && this.username && loggedInUsername !== this.username) {
      this.servicios.isFollowing(loggedInUsername, this.username).subscribe({
        next: (data) => {
          this.isFollowing = data.is_following;
        },
        error: (error) => {
          console.error('Error al verificar si se está siguiendo:', error);
          this.isFollowing = false; 
        }
      });
    } else if (loggedInUsername === this.username) {
      this.isFollowing = true; 
    }
}

checkIfBlocked() {
    const loggedInUsername = this.getCurrentLoggedInUsername();
    if (loggedInUsername && this.username && loggedInUsername !== this.username) {
      this.servicios.isBlocked(loggedInUsername, this.username).subscribe({
        next: (data) => {
          this.isBlocked = data.is_following;
          console.log('isBlocked:', this.isBlocked);
        },
        error: (error) => {
          console.error('Error al verificar si se bloquea:', error);
          this.isBlocked = false; 
        }
      });
    }
}

  toggleFollow() {
    if(this.isBlocked === true){
      this.showAlert = true;
      this.alertText = this.textosPerfilUsuario['cantfollow'];
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
      return
    }
    const loggedInUsername = this.getCurrentLoggedInUsername();
    if (loggedInUsername && this.username && loggedInUsername !== this.username) {
      this.servicios.followUnfollow(loggedInUsername, this.username).subscribe({
        next: (response) => {
          if(response.message.includes('Comenzaste a seguir')){
            this.isFollowing = !this.isFollowing;
            this.showAlert = true;
            this.alertText = this.textosPerfilUsuario['userFollowed'];
            this.alertColor = 'green'; 
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
            this.loadUserData(); 
            this.checkIfFollowing();
          } else {
            this.isFollowing = !this.isFollowing;
            this.showAlert = true;
            this.alertText = this.textosPerfilUsuario['userUnfollowed'];
            this.alertColor = 'green'; 
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
            this.loadUserData(); 
          }
          
        },
        error: (error) => {
          console.error('Error al seguir/dejar de seguir:', error);
        }
      });
    }
  }

  marcarBuenUsuario() {
    if (this.username) {
      this.servicios.marcarBuenUsuario(this.username).subscribe({
        next: (response) => {
          console.log('Buen usuario marcado:', response);
          this.loadValoracionGlobal();
        },
        error: (error) => {
          console.error('Error al marcar como buen usuario:', error);
        }
      });
    }
  }

  marcarMalUsuario() {
    if (this.username) {
      this.servicios.marcarMalUsuario(this.username).subscribe({
        next: (response) => {
          console.log('Mal usuario marcado:', response);
          this.loadValoracionGlobal();
        },
        error: (error) => {
          console.error('Error al marcar como mal usuario:', error);
        }
      });
    }
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  handleViewPost(postId: number) {
    this.goToPost(postId);
  }

  handleViewEvent(eventId: number) {
    this.router.navigate(['main/big_event', eventId]);
    console.log('Ver detalles del evento:', eventId);
  }

  toggleView(view: 'posts' | 'events') {
    this.showPosts = view === 'posts';
  }
}