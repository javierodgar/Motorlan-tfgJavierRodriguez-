import { Component } from '@angular/core';
import { EventosSideComponent } from '../eventos-side/eventos-side.component';
import { EventosFinalizadosParticipadosSideComponent } from '../eventos-finalizados-participados-side/eventos-finalizados-participados-side.component';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { ServiciosService } from '../../servicios.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TraduccionesService } from '../../traducciones.service';
@Component({
  selector: 'app-display-peque',
  imports: [EventosSideComponent, EventosFinalizadosParticipadosSideComponent, DatePipe, CommonModule, FormsModule],
  templateUrl: './display-peque.component.html',
  styleUrl: './display-peque.component.css'
})
export class DisplayPequeComponent {
  eventosInscritos: any[] = [];
  username: any;

  textosMain: any = {};
  idiomaActual: string = 'es'; 

  eventosPopulares: any[] = [];
  usuarioCreadorExcluir: string = 'asd';

  publicacionesDestacadas: any[] = [];
  loading: boolean = true;
  error: string = '';
  usuarioLogueado = 'asd';


  activeTab: 'destacadas' | 'events' = 'destacadas';


  constructor(private eventoService: ServiciosEventosService, private servicios: ServiciosService, private traduccionesService: TraduccionesService , private router: Router) {
    this.username = this.getCookie('username');
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosMain('textos_main');
    this.usuarioCreadorExcluir = this.username;
    this.usuarioLogueado = this.username;
    this.cargarEventosInscritos(this.username);
    this.cargarEventosPopulares();
    this.cargarPublicacionesDestacadas();
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
    
  

  showPostId(postId: number): void {
    this.router.navigate(['main/big_post', postId]);
  }
  showEventoId(eventoId: number): void {
    this.router.navigate(['main/big_event', eventoId]);
  }

  setActiveTab(tab: 'destacadas' | 'events'): void {
    this.activeTab = tab;
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

  cargarPublicacionesDestacadas(): void {
  this.loading = true;
  this.servicios.getPublicacionesDestacadas(this.usuarioLogueado).subscribe({
    next: (data) => {
      console.log('estas son las destacadas: ', data);
      this.publicacionesDestacadas = data.map(publicacion => {
        if (publicacion.texto && publicacion.texto.length > 150) {
          return {
            ...publicacion,
            texto: publicacion.texto.substring(0, 150) + '...'
          };
        }
        return publicacion;
      });
      this.loading = false;
    },
    error: (err) => {
      this.error = 'Error al cargar las publicaciones destacadas.';
      console.error(err);
      this.loading = false;
    }
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
}
