import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiciosEventosService } from '../../../servicios-eventos.service';
import { Subject, takeUntil, switchMap  } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AlertComponent } from '../../../alert/alert.component';
import { TraduccionesService } from '../../../traducciones.service';

@Component({
  selector: 'app-listado-inscritos',
  imports: [CommonModule, AlertComponent],
  templateUrl: './listado-inscritos.component.html',
  styleUrl: './listado-inscritos.component.css'
})
export class ListadoInscritosComponent {
  @Input() eventoEstado: number | null = null;
  eventoId: number | null = null;
  inscritos: any[] = [];
  private readonly destroy$ = new Subject<void>();

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red'; 

  textosInscritos: any = {}; 
  idiomaActual: string = 'es'

  constructor(
    private serviciosEventosService: ServiciosEventosService,
    private route: ActivatedRoute,
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
  
  cargarTextosInscritos(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosInscritos = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de la lista de inscritos', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosInscritos('texto_listado_inscritos');
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosInscritos('texto_listado_inscritos');
    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.eventoId = +idParam;
          return this.cargarInscritosObservable(+idParam);
        } else {
          console.warn('No se encontró el ID del evento en la URL.');
          return [[]];
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(
      (data) => {
        this.inscritos = data;
        console.log('Inscritos del evento:', this.inscritos);
      },
      (error) => {
        console.error('Error al cargar los inscritos:', error);
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarInscritosObservable(eventoId: number) {
    return this.serviciosEventosService.obtenerInscritosEvento(eventoId);
  }

  cargarInscritos(): void {
    if (this.eventoId !== null) {
      this.serviciosEventosService.obtenerInscritosEvento(this.eventoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (data) => {
            this.inscritos = data;
          },
          (error) => {
            console.error('Error al cargar los inscritos:', error);
          }
        );
    }
  }

  eliminarInscrito(usuarioId: number) {
    if (this.eventoId !== null) {
      this.serviciosEventosService.eliminarInscritoEvento(this.eventoId, usuarioId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response) => {
            console.log('Respuesta de eliminación:', response);
            this.cargarInscritos(); 
          },
          (error) => {
            console.error('Error al eliminar el inscrito:', error);
          }
        );
    } else {
      console.warn('No se puede eliminar el inscrito porque no se tiene el ID del evento.');
    }
  }

  bloqueoEliminacion(){
    this.showAlert = true; 
          this.alertText = 'No es posible eliminar a un inscrto si el evento esta en proceso o finalizado';
          this.alertColor = 'red'; 
          setTimeout(() => {
            this.showAlert = false; 
          }, 3000); 
  }
}
