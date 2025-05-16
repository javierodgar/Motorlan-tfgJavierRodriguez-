import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ServiciosService } from '../servicios.service'; 
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common'; 
import { TraduccionesService } from '../traducciones.service';

@Component({
  selector: 'app-hashtag-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hashtag-posts.component.html',
  styleUrl: './hashtag-posts.component.css'
})
export class HashtagPostsComponent implements OnInit, OnDestroy {
  hashtag: string = '';
  posts: any[] = [];
  loading: boolean = false;
  error: string = '';
  dataUrl = 'http://localhost/dataTFG/'; 
  private routeSub: Subscription | undefined;

  textosHashtagPosts: any = {};
  idiomaActual: string = 'es'; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ServiciosService,
    private traduccionesService: TraduccionesService 
  ) { }

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

  cargarTextosHashtagPosts(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosHashtagPosts = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de hashtag posts', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosHashtagPosts('textos_hashtag_post');
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosHashtagPosts('textos_hashtag_post');
    this.loading = true;
    this.routeSub = this.route.params.subscribe(params => {
      this.hashtag = params['hashtag'];
      this.loadPostsByHashtag(this.hashtag);
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadPostsByHashtag(hashtag: string): void {
    this.loading = true;
    this.error = '';
    this.service.getPostsByHashtag(hashtag).subscribe({
      next: (data: any[]) => {
        this.posts = data.filter(post => post.tipo === 'publicacion'); 
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las publicaciones.';
        console.error(err);
        this.loading = false;
        this.posts = [];
      }
    });
  }

  trackById(index: number, post: any): number {
    return post.id; 
  }

  onpostClick(id: any): void {
    this.router.navigate(['main/big_post', id]); 
  }
}