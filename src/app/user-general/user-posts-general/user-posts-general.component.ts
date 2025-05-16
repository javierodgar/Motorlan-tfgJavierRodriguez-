import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TraduccionesService } from '../../traducciones.service';
@Component({
  selector: 'app-user-posts-general',
  imports: [CommonModule],
  templateUrl: './user-posts-general.component.html',
  styleUrl: './user-posts-general.component.css'
})
export class UserPostsGeneralComponent {
  @Input() posts: any[] = [];
  @Input() dataUrl: string = '';
  @Output() viewPost = new EventEmitter<number>();

  textosUserPosts: any = {}; 
  idiomaActual: string = 'es'; 

  constructor(
    private router: Router,
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

  ngOnInit() {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosUserPosts('textos_posts_user_general');
  }

  cargarTextosUserPosts(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosUserPosts = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de las publicaciones del usuario', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosUserPosts('textos_posts_user_general');
  }

  goToPost(id: number) {
    this.viewPost.emit(id);
  }
}
