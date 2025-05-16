import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PostUpdateService } from '../post-update.service';
import { UserPostsComponent } from './user-posts/user-posts.component';
import { UserEventsComponent } from './user-events/user-events.component';
import { ModalGestionUsuarioComponent } from './modal-gestion-usuario/modal-gestion-usuario.component';
import { AlertComponent } from '../alert/alert.component';
import { TraduccionesService } from '../traducciones.service';
@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserPostsComponent, UserEventsComponent, ModalGestionUsuarioComponent, AlertComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  //declaracion de variables necesarias para este componente
  dataUrl = 'http://localhost/dataTFG/';
  userData: any = null;
  usernameChangeLog: any = null;
  posts: any[] = [];
  events: any[] = [];
  followersCount: number = 0;
  followingCount: number = 0;
  showEditModal: boolean = false;
  username: string | null = null;
  profileImage: string | null = null;
  showPosts: boolean = true; 
  showGestionModal: boolean = false;

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red';  

  textosPerfil: any = {}; 
  idiomaActual: string = 'es'; 

  private postUpdateSubscription: Subscription;

  
  editForm = new FormGroup({
    usuario: new FormControl('', [Validators.required]),
    nombre: new FormControl('', [Validators.required]),
    apellido1: new FormControl('', [Validators.required]),
    apellido2: new FormControl(''),
    correo_electronico: new FormControl('', [Validators.required, Validators.email]),
    ciudad_residencia: new FormControl('', [Validators.required]),
    profile_image: new FormControl<File | null>(null)
  });

  
  followForm = new FormGroup({
    followUsername: new FormControl('', [Validators.required])
  });

  constructor(private servicios: ServiciosService, private router: Router, private postUpdateService: PostUpdateService, private traduccionesService: TraduccionesService
  ) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => {
      this.loadPosts();
    })
  }

  /**
   * Se llama cuando se inicia el componente. Se encarga de:
   *
   * 1. Obtener el nombre de usuario desde una cookie.
   * 2. Mostrar un mensaje de error si no hay usuario logeado.
   * 3. Cargar la informacion del usuario.
   * 4. Cargar la imagen del perfil del usuario.
   */
  ngOnInit() {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosPerfil('textos_user_profile_principal');
    this.username = this.getCookie('username');
    if (!this.username) {
      alert('No hay usuario logeado. Por favor, inicia sesión.');
      this.router.navigate(['/']);
    }
    this.loadUserData();
    this.loadProfileImage();
  }

  cargarTextosPerfil(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosPerfil = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos del perfil de usuario', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosPerfil('textos_user_profile_principal');
  }

  ngOnDestroy(): void {
    if (this.postUpdateSubscription) {
      this.postUpdateSubscription.unsubscribe();
    }
  }

  // Método para abrir el modal de gestión de usuario
  openGestionModal(): void {
    this.showGestionModal = true;
    console.log('openGestionModal - userData al abrir el modal:', this.userData); // Mostrar al abrir el modal
  }
  

 
  closeGestionModal(): void {
    this.showGestionModal = false;
  }

 
  handleUserUpdated(formData: FormData): void {
    this.username = this.getCookie('username');
    window.location.reload();
    this.loadUserData();
  }


  /**
   * Gets the value of a cookie with the given name.
   * Returns null if the cookie does not exist.
   * @param name The name of the cookie.
   */
  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }


  /**
   * Loads the posts of the currently logged-in user from the server.
   * If the username is available, it makes a request to fetch user data and updates the posts array.
   * Logs a message if no posts are found or if there is an error in retrieving posts.
   * Warns if there is no logged-in user.
   */
  loadPosts() {
    if (this.username) {
      this.servicios.getUserData(this.username).subscribe({
        next: (data) => {
          if (data && data.posts) {
            this.posts = data.posts;
          } else {
            console.log('No se encontraron publicaciones o hubo un error al recargarlas.');
          }
        },
        error: (error) => {
          console.error('Error al recargar las publicaciones:', error);
        }
      });
    } else {
      console.warn('No se puede recargar las publicaciones porque no hay usuario logeado.');
    }
  }

  /**
   * Loads the user data from the server using the currently logged in user.
   * Populates the userData, posts, followersCount, and followingCount fields.
   * Also populates the editForm with the user data.
   * If the user is not found, sets userData to null and logs an error.
   */
  loadUserData() {
    this.servicios.getUserData(this.username!).subscribe({
      next: (data) => {
        if (data.user) {
          this.userData = data.user;
          this.usernameChangeLog = data.usernameChangeLog;
          this.posts = data.posts;
          this.events = data.events;
          this.followersCount = data.followersCount;
          this.followingCount = data.followingCount;
          this.editForm.patchValue({
            usuario: this.userData.usuario,
            nombre: this.userData.nombre,
            apellido1: this.userData.apellido1,
            apellido2: this.userData.apellido2 || '',
            correo_electronico: this.userData.correo_electronico,
            ciudad_residencia: this.userData.ciudad_residencia
          });
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

  /**
   * Loads the profile image for the currently logged in user from the server.
   * Populates the profileImage field with the image if it exists, or null if not.
   * Logs an error if there is an error loading the image.
   */
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

  /**
   * Abre el modal para editar el perfil del usuario.
   * Establece la variable showEditModal en true para mostrar el modal.
   */
  openEditModal() {
    this.showEditModal = true;
    
  }

  /**
   * Cierra el modal para editar el perfil del usuario.
   * Establece la variable showEditModal en false para ocultar el modal.
   * Limpia el formulario de edicion de perfil.
   */
  closeEditModal() {
    this.showEditModal = false;
    this.editForm.reset({
      nombre: this.userData.nombre,
      apellido1: this.userData.apellido1,
      apellido2: this.userData.apellido2 || '',
      correo_electronico: this.userData.correo_electronico,
      ciudad_residencia: this.userData.ciudad_residencia,
      profile_image: null
    });
  }

  /**
   * Handler for the file change event on the profile image input.
   * Gets the selected file from the input element and updates the
   * profile_image field in the edit form with the selected file.
   * @param event The event object from the file change event.
   */
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editForm.patchValue({ profile_image: input.files[0] });
    }
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }

  /**
   * Handler for the edit profile form submission.
   * Updates the user data on the server with the form data.
   * If the form is valid, creates a FormData object with the form data.
   * If the user has selected a new profile image, adds it to the FormData.
   * Submits the FormData to the updateUser endpoint.
   * Shows an alert with the response message from the server.
   * If the response message indicates success, closes the edit modal and reloads the user data and profile image.
   */
  onEditSubmit() {
    if (this.editForm.valid) {
      const formData = new FormData();
      formData.append('usuario', this.username!);
      formData.append('usuarioNuevo', this.editForm.get('usuario')!.value!);
      formData.append('nombre', this.editForm.get('nombre')!.value!);
      formData.append('apellido1', this.editForm.get('apellido1')!.value!);
      formData.append('apellido2', this.editForm.get('apellido2')!.value || '');
      formData.append('correo_electronico', this.editForm.get('correo_electronico')!.value!);
      formData.append('ciudad_residencia', this.editForm.get('ciudad_residencia')!.value!);
      const imageFile = this.editForm.get('profile_image')!.value;
      if (imageFile) {
        formData.append('profile_image', imageFile);
      }

      this.servicios.updateUser(formData).subscribe({
        next: (response) => {
          alert(response.message);
          this.showAlert = true;
          this.alertText = response.message;
          this.alertColor = 'green';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          if (response.message === "Datos del usuario actualizados exitosamente") {
            this.setCookie('username', this.editForm.get('usuario')!.value!, 1);
            this.username = this.getCookie('username');
            this.closeEditModal();
            this.loadUserData();
            this.loadProfileImage(); 
          }
        },
        error: (error) => {
          console.error('Error al guardar los datos:', error);
          this.showAlert = true;
          this.alertText = 'error al guardar los cambios';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        }
      });
    }
  }

  /**
   * Handler for the follow form submission.
   * If the form is valid, logs the username the user wants to follow to the console.
   * Resets the follow form.
   */
  // onFollowSubmit() {
  //   if (this.followForm.valid) {
  //     console.log('Seguir a:', this.followForm.get('followUsername')?.value);
  //     this.followForm.reset();
  //   }
  // }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  handleViewPost(postId: number) {
    this.goToPost(postId);
  }

  goToEvent(id:number){
    this.router.navigate(['main/big_event', id]);
  }

  handleViewEvent(eventId: number) {
    this.goToEvent(eventId);
  }


  toggleView(view: 'posts' | 'events') {
    this.showPosts = view === 'posts';
  }
}
