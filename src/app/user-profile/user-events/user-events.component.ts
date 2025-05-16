import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TraduccionesService } from '../../traducciones.service';

@Component({
  selector: 'app-user-events',
  imports: [CommonModule, DatePipe],
  templateUrl: './user-events.component.html',
  styleUrl: './user-events.component.css'
})
export class UserEventsComponent {
  @Input() events: any[] = [];
  @Input() dataUrl: string = 'http://localhost/dataTFG/'; 
  @Output() viewEvent = new EventEmitter<number>();
  textosUserEvents: any = {}; 
  idiomaActual: string = 'es'; 
  constructor(private router: Router,private traduccionesService: TraduccionesService) { }

  ngOnInit() {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosUserEvents('textos_events_user_profile_principal'); 
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
    this.cargarTextosUserEvents('textos_events_user_profile_principal');
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

  goToEvent(id: number) {
    this.viewEvent.emit(id);
  }
}
