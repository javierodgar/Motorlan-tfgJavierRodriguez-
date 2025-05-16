import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TraduccionesService } from '../../traducciones.service';
@Component({
  selector: 'app-eventos-side',
  imports: [CommonModule, DatePipe],
  templateUrl: './eventos-side.component.html',
  styleUrl: './eventos-side.component.css'
})
export class EventosSideComponent {
  @Input() eventosInscritos: any[] = [];
  eventosPendientes: any[] = [];

  textosEventosSide: any = {}; 
  idiomaActual: string = 'es'; 

  constructor(private router: Router, private TraduccionesService: TraduccionesService) { }

  cargarTextosEventosSide(nombreArchivo: string) {
    this.TraduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosEventosSide = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de eventos side', error);
      }
    );
  }

  cambiarIdioma(lang: string) {
    this.idiomaActual = lang;
    this.cargarTextosEventosSide('eventos_side');
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosEventosSide('eventos_side');
    console.log('Eventos inscritos recobodos:', this.eventosInscritos);
    this.filtrarEventosPendientes();
    console.log('hooooool');
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

  filtrarEventosPendientes(): void {
    const ahora = new Date();
    this.eventosPendientes = this.eventosInscritos.filter(evento => {
      const fechaFinEvento = new Date(evento.fecha_fin);
      return fechaFinEvento > ahora;
    });
  }

  mostrarMensaje(id:number): void {
    console.log('id evento:', id);
    this.router.navigate(['main/big_event', id]);
  }
}
