import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TraduccionesService } from '../../traducciones.service';
@Component({
  selector: 'app-user-events-general',
  imports: [CommonModule, DatePipe],
  templateUrl: './user-events-general.component.html',
  styleUrl: './user-events-general.component.css'
})
export class UserEventsGeneralComponent {
  @Input() events: any[] = [];
  @Input() dataUrl: string = 'http://localhost/dataTFG/';
  @Output() viewEvent = new EventEmitter<number>();

  textosUserEvents: any = {}; 
  idiomaActual: string = 'es'; 

  constructor(private router: Router,
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

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosUserEvents('textos_eventos_user_general');
  }

  cargarTextosUserEvents(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosUserEvents = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de los eventos del usuario', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosUserEvents('utextos_eventos_user_general');
  }

  goToEvent(id: number) {
    this.viewEvent.emit(id);
  }
}
