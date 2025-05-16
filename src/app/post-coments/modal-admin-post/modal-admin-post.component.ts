import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditarPostComponent } from './editar-post/editar-post.component';
import { ServiciosService } from '../../servicios.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TraduccionesService } from '../../traducciones.service';
import { ViewEncapsulation } from '@angular/core';
import { ConfirmationComponent } from '../../confirmation/confirmation.component';
@Component({
  selector: 'app-modal-admin-post',
  imports: [CommonModule, EditarPostComponent, ConfirmationComponent ],
  templateUrl: './modal-admin-post.component.html',
  styleUrl: './modal-admin-post.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ModalAdminPostComponent {
  @Input() isVisible: boolean = false;
  @Output() modalClosed = new EventEmitter<void>();
  activeTab: 'apartado1' | 'apartado2' | 'apartado3' = 'apartado1';
  postId: number | null = null; 

  textosModalAdminPost: any = {}; 
  idiomaActual: string = 'es'; 
  
  showConfirmationDialog: boolean = false;
  

  constructor(
    private postService: ServiciosService,
    private route: ActivatedRoute,
    private router: Router,
    private traduccionesService: TraduccionesService
    ) { }

    cargarTextosModalAdminPost(nombreArchivo: string) {
      this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
        data => {
          this.textosModalAdminPost = data[this.idiomaActual];
        },
        error => {
          console.error('Error al cargar los textos del modal admin post', error);
        }
      );
    }
  
    cambiarIdioma(idioma: string) {
      this.idiomaActual = idioma;
      this.cargarTextosModalAdminPost('textos_modal_admin_post');
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
  

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosModalAdminPost('textos_modal_admin_post');
    this.route.params.subscribe(params => {
      this.postId = +params['id'];
    });
  }

  

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  setActiveTab(tab: 'apartado1' | 'apartado2' | 'apartado3'): void {
    this.activeTab = tab;
  }

  eliminarPublicacionPregunta(): void {
    this.showConfirmationDialog = true;
  }

  onConfirmationResult(confirmed: boolean): void {
      this.showConfirmationDialog = false; 
      if (confirmed) {
        this.eliminarPublicacion();
      }
    }

  eliminarPublicacion(): void {
    if (this.postId) {
      this.postService.eliminarPost(this.postId).subscribe(
        (response) => {
          console.log('Publicación eliminada:', response);
          this.router.navigate(['main/posts']); 
        },
        (error) => {
          console.error('Error al eliminar la publicación:', error);
        }
      );
    }
  }


}
