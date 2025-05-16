import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditarEventoComponent } from './editar-evento/editar-evento.component';
import { ListadoInscritosComponent } from './listado-inscritos/listado-inscritos.component';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationComponent } from '../../confirmation/confirmation.component';
import { AlertComponent } from '../../alert/alert.component';
import { TraduccionesService } from '../../traducciones.service';
@Component({
  selector: 'app-modal-admin-evento',
  imports: [CommonModule, EditarEventoComponent, ListadoInscritosComponent, ConfirmationComponent, AlertComponent],
  templateUrl: './modal-admin-evento.component.html',
  styleUrl: './modal-admin-evento.component.css'
})
export class ModalAdminEventoComponent implements OnInit, OnDestroy {
  showConfirmationDialog: boolean = false;
  showConfirmationDialog2: boolean = false;


  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red'; 
  
  @Input() isVisible: boolean = false;
  @Input() estado: number = 0;
  @Output() recargarEvento = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();
  @Output() eventoGuardado = new EventEmitter<any>();
  @Output() estadoActualizado = new EventEmitter<any>();
  activeTab: 'edicion' | 'suscritos' | 'estados' = 'edicion';
  eventoId: number = 0;
  estadoId: number = 0;
  loggedInUsername = '';
  private readonly destroy$ = new Subject<void>();
  cancelarReanudar: string = '';
  nuevoEstado:number = 0;

  textosModalAdmin: any = {}; 
  idiomaActual: string = 'es';

  constructor(
    private serviciosEventosService: ServiciosEventosService,
    private route: ActivatedRoute,
    private traduccionesService: TraduccionesService
  ) { }

  cargarTextosModalAdmin(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosModalAdmin = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos del modal de administración', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosModalAdmin('textos_modal_admin_eventos');
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

  seleccionarEstado(){
    if(this.estado == 1){
      this.cancelarReanudar = 'cancelar';
      this.nuevoEstado = 4;
    } else if(this.estado == 4){
      this.cancelarReanudar = 'reanudar';
      this.nuevoEstado = 1;
    }
  }

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
    this.recargarEvento.emit('recargar');
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.estado = +this.getCookie('estado_id')!.toString();
    this.cargarTextosModalAdmin('textos_modal_admin_eventos');
    console.log('mmmmmmm ', this.estado);
    this.loggedInUsername = this.getCookie('username') || '';
    if (!this.loggedInUsername) {
      console.error('No se encontró el nombre de usuario en las cookies.');
    }
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.eventoId = +idParam;
      } else {
        console.warn('No se encontró el ID del evento en la URL.');
      }
    });
    this.seleccionarEstado();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  guardarCambios(eventoEditado: any): void {
    console.log('Evento editado recibido en el modal:', eventoEditado);
    this.eventoGuardado.emit(eventoEditado);
    this.recargarEvento.emit('recargar');
    this.closeModal();
  }

  cancelarEdicion(): void {
    this.setActiveTab('edicion');
  }

  setActiveTab(tab: 'edicion' | 'suscritos' | 'estados'): void {
    this.activeTab = tab;
  }

  actualizarEstadoPreguta(eventoId: number, estadoId: number) {
    this.showConfirmationDialog2 = true;
    this.estadoId = estadoId;
    this.eventoId = eventoId;
  }

  onConfirmationResult2(confirmed: boolean): void {
    if (confirmed) {
      this.actualizarEstado(this.eventoId, this.estadoId);
    }
    this.showConfirmationDialog2 = false;
  }

  actualizarEstado(eventoId: number, estadoId: number) {
    this.serviciosEventosService.actualizarEstadoEvento(eventoId, estadoId).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if(estadoId == 1){
          this.cancelarReanudar = 'cancelar';
          this.nuevoEstado = 4;
        } else if(estadoId == 4){
          this.cancelarReanudar = 'reanudar';
          this.nuevoEstado = 1;
        }
        this.recargarEvento.emit('recargar');

      },
      error: (error) => {
        console.error('Error al actualizar el estado del evento:', error);
      }
    });
  }

  eliminarEvento(): void {
    if (this.eventoId) { 
      this.showConfirmationDialog = true;
    } else {
      console.warn('No se puede eliminar el evento. ID del evento no encontrado en la URL.');
    }
  }

  onConfirmationResult(confirmed: boolean): void {
    this.showConfirmationDialog = false; 
    if (confirmed && this.eventoId) {
      this.serviciosEventosService.eliminarEvento(this.eventoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response) => {
            console.log('Evento eliminado:', response);
            this.recargarEvento.emit('recargar');
            this.closeModal();
          },
          (error) => {
            console.error('Error al eliminar el evento:', error);
            this.showAlert = true;
            this.alertText = 'Error al eliminar el evento. Por favor, inténtelo de nuevo más tarde.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        );
    }
  }
}