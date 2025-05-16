import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { TraduccionesService } from '../../traducciones.service';
@Component({
  selector: 'app-eventos-finalizados-participados-side',
  imports: [CommonModule, DatePipe],
  templateUrl: './eventos-finalizados-participados-side.component.html',
  styleUrl: './eventos-finalizados-participados-side.component.css'
})
export class EventosFinalizadosParticipadosSideComponent {
  

  eventosInscritos: any[] = [];
  userLogged: string | null = this.getCookie('username');

  textosEventosFinalizados: any = {}; 
  idiomaActual: string = 'es'; 
  
  constructor(private router: Router, private eventoService: ServiciosEventosService, private TraduccionesService: TraduccionesService) { }

  cargarTextosEventosFinalizados(nombreArchivo: string) {
    this.TraduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosEventosFinalizados = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de eventos finalizados', error);
      }
    );
  }

  

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosEventosFinalizados('eventos_finalizados_participados');
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosEventosFinalizados('eventos_finalizados_participados');
    this.cargarEventosInscritosFinalizados(this.userLogged);
    console.log('hool')
  }

  mostrarMensaje(id:number): void {
    console.log('id evento:', id);
    this.router.navigate(['main/big_event', id]);
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

  cargarEventosInscritosFinalizados(username: any): void {
    console.log('Cargando eventos inscritos y finalizados para el usuario:', username);
    this.eventoService.obtenerEventosInscritosFinalizados(username).subscribe(
      (eventos) => {
        this.eventosInscritos = eventos;  
        console.log('Eventos inscritos y finalizados:', this.eventosInscritos);
      },
      (error) => {
        console.error('Error al cargar eventos inscritos:', error);
        
      }
    );
  }
}
