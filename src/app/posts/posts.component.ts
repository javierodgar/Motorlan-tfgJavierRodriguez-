import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { PostUpdateService } from '../post-update.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import { TraduccionesService } from '../traducciones.service';

@Component({
  selector: 'app-posts',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.css'
})
export class PostsComponent implements OnInit, OnDestroy {
  dataUrl = 'http://localhost/dataTFG/';
  posts: any[] = [];
  filteredPosts: any[] = [];
  filterValue: string = '';
  filterType: string = 'usuario';
  showModal: boolean = false;

  username: any = '';

  textosPosts: any = {}; 
  idiomaActual: string = 'es';

  private postUpdateSubscription: Subscription;
  page: number = 1;
  limit: number =10;
  allPostsLoaded: boolean = false;
  isLoadingMore: boolean = false;
  canLoadMore: boolean = true;
  delayTime: number = 1000;

  postForm = new FormGroup({
    usuario: new FormControl(''),
    titulo: new FormControl('', [Validators.required]),
    texto: new FormControl('', [Validators.required]),
    hashtags: new FormControl([]),
    imagen: new FormControl<File | null>(null)
  });

  constructor(private router: Router, private http: HttpClient, private servicios: ServiciosService, private postUpdateService: PostUpdateService, private traduccionesService: TraduccionesService) {
    this.postUpdateSubscription = this.postUpdateService.postCreated$.subscribe(() => {
      this.resetPostsAndLoad();
    });
    this.username = this.getCookie('username');
  }

  cargarTextosPosts(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosPosts = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de la página de posts', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosPosts('textos_post');
    this.resetPostsAndLoad();
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

  ngOnInit() {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosPosts('textos_post');
    this.postForm.patchValue({ usuario: 'nombreDeUsuario' });
    this.loadPosts();
  }

  goToPost(id: number) {
    this.router.navigate(['main/big_post', id]);
  }

  loadPosts(filter: { value: string } | null = null) {
    if (this.isLoadingMore || this.allPostsLoaded) {
      return;
    }
    this.isLoadingMore = true;
    console.log('Cargando publicaciones...', `Página: ${this.page}`, `Límite: ${this.limit}`, 'Filtro:', filter);
    this.servicios.getPosts(this.page, this.limit, this.username).subscribe({
      next: (data: any) => {
        if (data.data && data.data.length > 0) {
          const newPosts = data.data.map((post: any) => {
            post.formattedHashtags = post.hashtags || [];
            return post;
          });
          this.posts = [...this.posts, ...newPosts];
          this.applyFilter(filter);
          if (data.data.length < this.limit) {
            this.allPostsLoaded = true;
          }
          this.page++;
        } else {
          this.allPostsLoaded = true;
        }
      },
      error: (error: any) => {
        console.error("Error al cargar publicaciones:", error);
      },
      complete: () => {
        this.isLoadingMore = false;
      }
    });
  }

  applyFilter(filter: { value: string } | null) {
    if (filter && filter.value) {
      const searchTerm = this.filterValue.toLowerCase();
      this.filteredPosts = this.posts.filter(post => {
        let resultado = false;
        switch (filter.value) {
          case 'usuario':
            resultado = post.usuario.toLowerCase().includes(searchTerm);
            break;
          case 'titulo':
            resultado = post.titulo.toLowerCase().includes(searchTerm);
            break;
          case 'hashtags':
            resultado = post.formattedHashtags?.some((tag: string) => tag.toLowerCase().includes(searchTerm)) ?? false;
            break;
          default:
            resultado = false;
        }
        return resultado;
      });
    } else {
      this.filteredPosts = [...this.posts];
    }
  }

  onFilterKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.resetPostsAndLoad();
    }
  }

  onFilterTypeChange() {
    this.resetPostsAndLoad();
  }

  resetPostsAndLoad() {
    this.posts = [];
    this.filteredPosts = [];
    this.page = 1;
    this.allPostsLoaded = false;
    this.loadPosts({ value: this.filterType });
  }

  openModal() {
    this.showModal = true;
    console.log('abre');
  }

  closeModal() {
    this.showModal = false;
    this.postForm.reset();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.postForm.patchValue({ imagen: input.files[0] });
    }
  }

  onSubmit() {
    if (this.postForm.valid) {
      const formData = new FormData();
      formData.append('usuario', this.postForm.get('usuario')!.value!);
      formData.append('titulo', this.postForm.get('titulo')!.value!);
      formData.append('texto', this.postForm.get('texto')!.value!);

      const hashtagsControl = this.postForm.get('hashtags');
      if (hashtagsControl && hashtagsControl.value && Array.isArray(hashtagsControl.value)) {
        const formattedHashtags = hashtagsControl.value.map((hashtag: string) => {
          return hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
        });
        formData.append('hashtags', formattedHashtags.join(','));
      } else {
        formData.append('hashtags', '');
      }

      const imageFile = this.postForm.get('imagen')!.value;
      if (imageFile) {
        formData.append('imagen', imageFile);
      }

      this.servicios.savePost(formData).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.message === "Publicación creada exitosamente") {
            this.closeModal();
            this.resetPostsAndLoad();
          }
        },
        error: (error) => {
          console.error('Error al guardar la publicación:', error);
        }
      });
    } else {
      console.log('Formulario no válido:', this.postForm.errors);
    }
  }

 @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;
    const umbral = 25;

    if (pos >= (max - umbral) && !this.isLoadingMore && !this.allPostsLoaded && this.canLoadMore) {
      this.canLoadMore = false;
      this.loadPosts({ value: this.filterType });
      setTimeout(() => {
        this.canLoadMore = true;
      }, this.delayTime);
    }
  }

  ngOnDestroy(): void {
    if (this.postUpdateSubscription) {
      this.postUpdateSubscription.unsubscribe();
    }
  }
}