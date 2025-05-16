import { Component, Output, EventEmitter, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiciosEventosService } from '../../servicios-eventos.service';
import { Map, TileLayer, Marker, LatLng, Icon, PointExpression } from 'leaflet';  
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AlertComponent } from '../../alert/alert.component';
import { PalabrasProhibidasService } from '../../palabras-prohibidas.service';
import { tap, switchMap, catchError, forkJoin, of } from 'rxjs';
import { TraduccionesService } from '../../traducciones.service';

@Component({
  selector: 'app-crear-eventos',
  standalone: true,
  imports: [FormsModule, CommonModule, AlertComponent],
  templateUrl: './crear-eventos.component.html',
  styleUrls: ['./crear-eventos.component.css']
})
export class CrearEventosComponent implements AfterViewInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() modalCerrado = new EventEmitter<void>();
  @Output() eventoCreadoExitoso = new EventEmitter<void>();

  estado_id: number = 1;
  
  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red'; 

  @ViewChild('mapaCrear') mapContainer!: ElementRef;
  private map: Map | undefined;
  private marker: Marker | undefined;
  private readonly destroy$ = new Subject<void>();
  private direccionInputValue = new Subject<string>(); 
  latitud: number = 39.2329021;
  longitud: number = -1.5861876;
  direccion: string = '';
  logedinUsername: string = '';

  textosCrearEvento: any = {};
  idiomaActual: string = 'es';

  imagenPrevisualizacion: string | null = null;
  selectedFile: File | null = null;

  constructor(private serviciosService: ServiciosEventosService, 
    private ngZone: NgZone, 
    private http: HttpClient, 
    private offensiveWordChecker: PalabrasProhibidasService,
    private traduccionesService: TraduccionesService) {
    this.logedinUsername = this.getCookie('username') || ''; 
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.setupDireccionDebounce(); 
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosCrearEvento('texto_crear_eventos');
  }

  cargarTextosCrearEvento(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosCrearEvento = data[this.idiomaActual]; 
      },
      error => {
        console.error('Error al cargar los textos del modal de crear eventos', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosCrearEvento('texto_crear_eventos'); 
  }

  cerrar() {
    this.isVisible = false;
    this.modalCerrado.emit();
  }

  submitForm(event: any) {
    event.preventDefault();
    this.mostrarCoordenadasEnConsola();
    this.guardarNuevoEvento(event.target);
  }

  mostrarCoordenadasEnConsola() {
    console.log('Coordenadas al enviar: Latitud:', this.latitud, 'Longitud:', this.longitud);
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

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.selectedFile = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPrevisualizacion = e.target.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.imagenPrevisualizacion = null;
    }
  }

  guardarNuevoEvento(form: any) {
    this.showAlert = false; 
    const fechaInicio = new Date(form.fecha_inicio.value);
    const fechaFin = new Date(form.fecha_fin.value);
    const fechaActual = new Date();
    const fechaMinimaInicio = new Date();
    fechaMinimaInicio.setDate(fechaActual.getDate() + 1);
    fechaMinimaInicio.setHours(fechaActual.getHours(), fechaActual.getMinutes(), fechaActual.getSeconds(), fechaActual.getMilliseconds());
  
    if (fechaInicio < fechaMinimaInicio) {
      this.showAlert = true;
      this.alertText = 'El evento debe crearse con al menos 24 horas de antelación.';
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
      return;
    }
  
    if (fechaFin <= fechaInicio) {
      this.showAlert = true;
      this.alertText = 'la fecha de finalización del evento debe ser posterior a la fecha de inicio.';
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
      return;
    }
  
    const titulo = form.titulo.value;
    const descripcion = form.descripcion.value;
  
    forkJoin([
      this.offensiveWordChecker.containsOffensiveWord(titulo),
      this.offensiveWordChecker.containsOffensiveWord(descripcion)
    ]).pipe(
      tap(([isTituloOffensive, isDescripcionOffensive]) => {
        if (isTituloOffensive || isDescripcionOffensive) {
          this.showAlert = true;
          this.alertText = 'El título o la descripción del evento contienen palabras ofensivas. Por favor, revísalos.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          throw new Error('Contenido ofensivo detectado');
        }
      }),
      switchMap(() => {
        const nuevoEvento = {
          usuario: this.logedinUsername,
          titulo: titulo,
          descripcion: descripcion,
          categoria: form.categoria.value,
          imagen_portada: form.imagen_portada.files[0],
          direccion: this.direccion,
          fecha_inicio: form.fecha_inicio.value,
          fecha_fin: form.fecha_fin.value,
          latitud: this.latitud,
          longitud: this.longitud
        };
        return this.serviciosService.crearEvento(this.formData(nuevoEvento));
      }),
      catchError(error => {
        if (error?.message === 'Contenido ofensivo detectado') {
          return of(null);
        }
        console.error('Error al crear evento:', error);
        this.showAlert = true;
        this.alertText = 'Error al crear evento.';
        this.alertColor = 'red';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          console.log('Evento creado:', response);
          this.eventoCreadoExitoso.emit();
          this.cerrar();
          form.reset();
        }
      },
      error: (error) => {
        if (error?.message !== 'Contenido ofensivo detectado') {
          console.error('Error en la suscripción de la creación del evento:', error);
        }
      }
    });
  }

  formData(evento: any): FormData {
    const formData = new FormData();
    formData.append('usuario', this.logedinUsername);
    formData.append('titulo', evento.titulo);
    formData.append('descripcion', evento.descripcion);
    formData.append('categoria', evento.categoria);
    if (evento.imagen_portada) {
      formData.append('imagen_portada', evento.imagen_portada, evento.imagen_portada.name);
    }
    formData.append('direccion', evento.direccion);
    formData.append('fecha_inicio', evento.fecha_inicio);
    formData.append('fecha_fin', evento.fecha_fin || '');
    formData.append('latitud', evento.latitud.toString());
    formData.append('longitud', evento.longitud.toString());

    
    return formData;
  }

  private initMap(): void {
    if (this.mapContainer) {
      const initialLatLng = new LatLng(this.latitud, this.longitud);
      this.map = new Map(this.mapContainer.nativeElement).setView(initialLatLng, 13);

      new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.addMarker(initialLatLng); 

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    } else {
      console.error('Error: mapContainer no está disponible para inicializar el mapa.');
    }
  }

  private addMarker(coords: LatLng): void {
    if (this.map) {
      const customIconOptions = {
        iconUrl: 'dataTFG/icons/pin-de-ubicacion.png', 
        iconSize: [25, 41] as PointExpression,
        iconAnchor: [12, 41] as PointExpression,
        popupAnchor: [1, -34] as PointExpression,
        shadowSize: [41, 41] as PointExpression,
        shadowAnchor: [12, 41] as PointExpression
      };

      const customIcon = new Icon(customIconOptions);

      this.marker = new Marker(coords, { icon: customIcon, draggable: true }).addTo(this.map);

      this.marker.on('dragend', () => {
        const newLatLng = this.marker?.getLatLng();
        if (newLatLng) {
          this.latitud = newLatLng.lat;
          this.longitud = newLatLng.lng;
          console.log('Nueva latitud (drag):', this.latitud, 'Nueva longitud (drag):', this.longitud);
          this.reverseGeocode(newLatLng.lat, newLatLng.lng);
        }
      });
    } else {
      console.warn('El mapa no está inicializado, no se puede añadir el marcador.');
    }
  }

  setupDireccionDebounce() {
    this.direccionInputValue.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(direccion => {
      if (direccion.length > 3) {
        this.geocodeAddress(direccion);
        this.direccion = direccion;
      } else {
        console.warn('Dirección demasiado corta para geocodificar.');
      }
    });
  }

  onDireccionInput(event: any) {
    this.direccionInputValue.next(event.target.value);
  }

  geocodeAddress(address: string) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    this.http.get<any[]>(nominatimUrl).pipe(takeUntil(this.destroy$)).subscribe(
      (results) => {
        if (results && results.length > 0) {
          this.latitud = parseFloat(results[0].lat);
          this.longitud = parseFloat(results[0].lon);
          console.log('Coordenadas obtenidas (geocode): Latitud:', this.latitud, 'Longitud:', this.longitud);
          this.updateMarkerPosition();
          this.reverseGeocode(this.latitud, this.longitud);
        } else {
          console.warn('No se encontraron coordenadas para la dirección:', address);
        }
      },
      (error) => {
        console.error('Error en la geocodificación:', error);
      }
    );
  }

  reverseGeocode(lat: number, lng: number): void {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    this.http.get<any>(nominatimUrl).pipe(takeUntil(this.destroy$)).subscribe(
      (data) => {
        if (data && data.display_name) {
          this.direccion = data.display_name;
          console.log('Dirección obtenida (reversa):', this.direccion);
        } else {
          this.direccion = 'Dirección no encontrada';
          console.warn('No se pudo obtener la dirección para estas coordenadas.');
        }
      },
      (error) => {
        this.direccion = 'Error al obtener la dirección';
        console.error('Error en la geocodificación inversa:', error);
      }
    );
  }

  updateMarkerPosition() {
    if (this.map && this.marker) {
      const newLatLng = new LatLng(this.latitud, this.longitud);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, 13);
    }
  }
}