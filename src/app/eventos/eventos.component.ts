import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrearEventosComponent } from './crear-eventos/crear-eventos.component'; 
import { ServiciosEventosService } from '../servicios-eventos.service';
import { Router } from '@angular/router';
import { TraduccionesService } from '../traducciones.service';
import { AlertComponent } from '../alert/alert.component';
@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearEventosComponent, AlertComponent],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {
  eventos: any[] = [];
  eventosFinalizados: any[] = [];
  filtroBusqueda: string = '';
  mostrarModalCrearEvento: boolean = false;
  valoracionUsuario: any = 0;
  username: any = '';

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red';  
  errorMessage: string = '';

  verEventosFinalizados: boolean = false; 

  textosEventos: any = {}; 
  idiomaActual: string = 'es'; 

  constructor(
    private serviciosService: ServiciosEventosService, 
    private router: Router,
    private traduccionesService: TraduccionesService
  ) { 
    this.username = this.getCookie('username');
  }


  cargarTextosEventos(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosEventos = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de eventos', error);
      }
    );
  }
  

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosEventos('textos_eventos');
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosEventos('textos_eventos'); 
    this.cargarEventos();
    this.valoracionUsuario = this.getCookie('valoracionUsuario') ;
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


  cargarEventos() {
    this.serviciosService.obtenerEventos(this.username).subscribe(
      (data) => {
        this.eventos = data;
      },
      (error) => {
        console.error('Error al cargar eventos:', error);
      }
    );

    this.serviciosService.obtenerEventosFinalizados(this.username).subscribe(
      (data) => {
        this.eventosFinalizados = data;
        console.log('Eventos finalizados:', this.eventosFinalizados);
      },
      (error) => {
        console.error('Error al cargar eventos finalizados:', error);
      }
    );

  }

  abrirModalCrearEvento() {
    console.log('Valoración del usuario:', this.valoracionUsuario);
    if(parseFloat(this.valoracionUsuario) >= 3.999){
      this.mostrarModalCrearEvento = true;
    } else {
      this.errorMessage = '';
          this.showAlert = true;
            this.alertText = this.textosEventos['EventCreateError'];
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
    }
  }

  cerrarModalCrearEvento() {
    this.mostrarModalCrearEvento = false;
  }

  onEventoCreadoExitoso() {
    this.cargarEventos(); 
    this.cerrarModalCrearEvento(); 
  }

  toggleEventosFinalizados() {
    this.verEventosFinalizados = !this.verEventosFinalizados;
  }

  filtrarEventos(): any[] {
    if (!this.filtroBusqueda) {
      return this.eventos;
    }
    const filtro = this.filtroBusqueda.toLowerCase();
    return this.eventos.filter(evento =>
      evento.titulo.toLowerCase().includes(filtro) ||
      evento.descripcion.toLowerCase().includes(filtro) ||
      evento.categoria.toLowerCase().includes(filtro) ||
      (evento.direccion && evento.direccion.toLowerCase().includes(filtro)) ||
      (evento.fecha_inicio && new Date(evento.fecha_inicio).toLocaleDateString().includes(filtro))
    );
  }

  filtrarEventosFinalizados(): any[] {
    if (!this.filtroBusqueda) {
      return this.eventosFinalizados;
    }
    const filtro = this.filtroBusqueda.toLowerCase();
    return this.eventosFinalizados.filter(evento =>
      evento.titulo.toLowerCase().includes(filtro) ||
      evento.descripcion.toLowerCase().includes(filtro) ||
      evento.categoria.toLowerCase().includes(filtro) ||
      (evento.direccion && evento.direccion.toLowerCase().includes(filtro)) ||
      (evento.fecha_inicio && new Date(evento.fecha_inicio).toLocaleDateString().includes(filtro))
    );
  }

  chunkArray(array: any[], size: number): any[][] {
    const chunkedArr: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
  }

  mostrarIdEvento(evento: any) {
    console.log('ID del evento clickeado:', evento.id);
    this.router.navigate(['main/big_event', evento.id]);
  }
}