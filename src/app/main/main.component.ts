import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { PostUpdateService } from '../post-update.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosEventosService } from '../servicios-eventos.service';
import { EventosSideComponent } from './eventos-side/eventos-side.component';
import { PalabrasProhibidasService } from '../palabras-prohibidas.service';
import { forkJoin, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { AlertComponent } from '../alert/alert.component';
import { EventosFinalizadosParticipadosSideComponent } from './eventos-finalizados-participados-side/eventos-finalizados-participados-side.component';
import { TraduccionesService } from '../traducciones.service';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, CommonModule, FormsModule, ReactiveFormsModule, EventosSideComponent, EventosFinalizadosParticipadosSideComponent, AlertComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  imagePreview: string | ArrayBuffer | null = null;

  showAlert: boolean = false;
  alertText: string = '';
  alertColor: string = 'red';


  publicacionesDestacadas: any[] = [];
  loading: boolean = true;
  error: string = '';
  usuarioLogueado = 'asd';

  eventosPopulares: any[] = [];
  usuarioCreadorExcluir: string = 'asd';

  activeTab: 'destacadas' | 'events' = 'destacadas';

  dataUrl = 'dataTFG/';
  posts: any[] = []; 
  filteredPosts: any[] = []; 
  filterValue: string = ''; 
  filterType: string = 'usuario'; 
  showModal: boolean = false; 
  username: string | null = null;
  profileImageUrl: string | null = null; 
  errorMessageProfileImage: string | null = null; 
  selectedHashtags: string[] = []; 

  postForm = new FormGroup({
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl<string[]>([]) 
    ,
    imagen: new FormControl<File | null>(null)
  });

  @ViewChild('hashtagInput') hashtagInput!: ElementRef; 

  eventosInscritos: any[] = []; 

  textosMain: any = {};
  idiomaActual: string = 'es'; 

  constructor(
    private router: Router,
    private http: HttpClient,
    private servicios: ServiciosService,
    private postUpdateService: PostUpdateService,
    private eventoService: ServiciosEventosService,
    private offensiveWordChecker: PalabrasProhibidasService, 
    private traduccionesService: TraduccionesService 
  ) {
    this.username = this.getCookie('username');
    if (this.username == null) {
      this.router.navigate(['/']);
    } else {
      this.obtenerImagenPerfil();
      this.usuarioLogueado = this.username; 
      this.usuarioCreadorExcluir = this.username; 
    }
  }

  cargarTextosMain(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosMain = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de la página principal', error);
      }
    );
  }
  

  cambiarIdioma(lang: string) {
    this.idiomaActual = lang;
    this.setCookie('lang', lang, 30);
    this.cargarTextosMain('textos_main');
    window.location.reload();
  }

  ngOnInit() {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosMain('textos_main'); 
    this.cargarEventosInscritos(this.username); 
    this.cargarPublicacionesDestacadas();
    this.cargarEventosPopulares();
  }

  setActiveTab(tab: 'destacadas' | 'events'): void {
    this.activeTab = tab;
  }

  cargarEventosPopulares(): void {
    this.loading = true;
    this.error = '';

    this.servicios.getEventosPopulares(this.usuarioCreadorExcluir)
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos del backend:', data);
          this.eventosPopulares = data;
          this.loading = false;
        },
      error: (err) => {
          this.error = 'Error al cargar los eventos populares.';
          console.error(err);
          this.loading = false;
        }
      });
  }

  showEventoId(eventoId: number): void {
    this.router.navigate(['main/big_event', eventoId]);
  }

  cargarPublicacionesDestacadas(): void {
    this.loading = true;
    this.servicios.getPublicacionesDestacadas(this.usuarioLogueado).subscribe({
      next: (data) => {
        console.log('estas son las destacadas: ',data)
        this.publicacionesDestacadas = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las publicaciones destacadas.';
        console.error(err);
        this.loading = false;
      }
    });
  }


  showPostId(postId: number): void {
    this.router.navigate(['main/big_post', postId]);
  }
  

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }


  cargarEventosInscritos(username: any): void {
    console.log('Cargando eventos inscritos para el usuario:', username);
    this.eventoService.obtenerEventosInscritos(username).subscribe(
      (eventos) => {
        this.eventosInscritos = eventos; 
        console.log('Eventos inscritos:', this.eventosInscritos);
      },
      (error) => {
        console.error('Error al cargar eventos inscritos:', error);
      }
    );
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

  openModal() {
    this.showModal = true;
    console.log('abre');
  }

  closeModal() {
    this.showModal = false;
    this.postForm.reset();
    this.selectedHashtags = [];
  }

  onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    this.postForm.patchValue({ imagen: file });

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result ?? null;
    };
    reader.readAsDataURL(file);
  } else {
    this.postForm.patchValue({ imagen: null });
    this.imagePreview = null;
  }
}

  addHashtagFromInput() {
    const inputValue = this.hashtagInput.nativeElement.value;
    const trimmedTag = inputValue.trim();
    if (trimmedTag && !this.selectedHashtags.includes(trimmedTag)) {
      const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      this.selectedHashtags.push(formattedTag);
    }
    this.hashtagInput.nativeElement.value = '';
  }

  removeSelectedHashtag(hashtagToRemove: string) {
    this.selectedHashtags = this.selectedHashtags.filter(hashtag => hashtag !== hashtagToRemove);
  }

  /**
   * Función que se ejecuta al enviar el formulario de creación de publicación.
   * Verifica si el formulario es válido y si el usuario está logeado.
   * Si el formulario es válido, crea un objeto FormData con los datos del formulario
   * y los envía al servidor para guardar la publicación.
   * Si la respuesta del servidor es positiva, cierra el modal.
   * Si hay un error, muestra el error en la consola.
   * Si el formulario no es válido, muestra el error en la consola.
   */
  onSubmit() {
    if (!this.username) {
      alert('No hay usuario logeado. Por favor, inicia sesión.');
      this.router.navigate(['']);
      return;
    }

    if (!this.postForm.valid) {
      console.log('Formulario no válido:', this.postForm.errors);
      return;
    }

    const tituloControl = this.postForm.get('titulo');
    const textoControl = this.postForm.get('texto');

    if (tituloControl && textoControl && tituloControl.value && textoControl.value) {
      const tituloValue: string = tituloControl.value;
      const textoValue: string = textoControl.value;

      forkJoin([
        this.offensiveWordChecker.containsOffensiveWord(tituloValue),
        this.offensiveWordChecker.containsOffensiveWord(textoValue)
      ]).pipe(
        tap(([isTituloOffensive, isTextoOffensive]) => {
          if (isTituloOffensive || isTextoOffensive) {
            this.showAlert = true;
            this.alertText = 'El título o el texto de la publicación contiene palabras ofensivas. Por favor, revísalo.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
            throw new Error('Contenido ofensivo detectado');
          }
          this.showAlert = false;
        }),
        switchMap(() => {
          const formData = new FormData();
          formData.append('usuario', this.username!);
          formData.append('titulo', tituloValue);
          formData.append('texto', textoValue);
          formData.append('hashtags', this.selectedHashtags.join(','));
          const imageFile = this.postForm.get('imagen')!.value;
          if (imageFile) {
            formData.append('imagen', imageFile);
          }
          return this.servicios.savePost(formData);
        }),
        catchError(error => {
          if (error?.message === 'Contenido ofensivo detectado') {
            return of(null);
          }
          console.error('Error al guardar la publicación:', error);
          this.alertText = 'Error al guardar la publicación.';
          this.alertColor = 'red';
          this.showAlert = true;
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          return of(null);
        })
      ).subscribe(
        (response) => {
          if (response) {
            console.log('Respuesta del servidor:', response);
            if (response.message === "Publicación creada exitosamente" || response.message === "Publicación actualizada exitosamente") {
              this.closeModal();
              this.postUpdateService.anouncePostCreated();
            } else if (response.message) {
              this.alertText = 'Error: ' + response.message;
              this.alertColor = 'red';
              this.showAlert = true;
              setTimeout(() => {
                this.showAlert = false;
              }, 3000);
            }
          }
        },
        (error) => {
          if (error?.message !== 'Contenido ofensivo detectado') {
            console.error('Error en la suscripción al guardar la publicación:', error);
          }
        }
      );
    } else {
      console.error('Error: El título o el texto del formulario son inválidos a pesar de la validación.');
    }
  }

  /**
   * Shows the posts page.
   */
  showPosts() {
    this.router.navigate(['main/posts']);
  }

  /**
   * Navigates to the user information page.
   */
  showUser() {
    this.router.navigate(['main/user_info']);
  }

  showSearch() {
    this.router.navigate(['main/search']);
  }

  showEvents() {
    this.router.navigate(['main/events']);
  }

  showExtra(){
    this.router.navigate(['main/extra']);
  }

  obtenerImagenPerfil(): void {
    if (this.username) {
      this.servicios.obtenerImagenPerfil(this.username).subscribe({
        next: (data) => {
          if (data && data.profile_image) {
            this.profileImageUrl =  data.profile_image;
            this.errorMessageProfileImage = null;
            console.log('URL de la imagen de perfil:', this.profileImageUrl);
            this.setCookie('valoracionUsuario', data.valoracion_global, 1);
          } else {
            this.profileImageUrl = null;
            this.errorMessageProfileImage = data?.message || 'No se encontró la imagen de perfil.';
            console.log(this.errorMessageProfileImage);
          }
        },
        error: (error) => {
          console.error('Error al obtener la imagen de perfil:', error);
          this.profileImageUrl = null;
          this.errorMessageProfileImage = 'Error al conectar con el servidor.';
        }
      });
    } else {
      console.log('No hay username disponible para obtener la imagen de perfil.');
    }
  }
}