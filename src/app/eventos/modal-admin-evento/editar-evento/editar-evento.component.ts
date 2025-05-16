import { Component, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap, takeUntil, debounceTime } from 'rxjs/operators';
import { Map, TileLayer, Marker, LatLng, Icon, PointExpression } from 'leaflet'; 
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ServiciosEventosService } from '../../../servicios-eventos.service';
import { TraduccionesService } from '../../../traducciones.service';
import { Evento } from '../../../evento';
import { EventoClase } from '../../../evento-class';


@Component({
  selector: 'app-editar-evento',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-evento.component.html',
  styleUrl: './editar-evento.component.css'
})
export class EditarEventoComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() guardarEvento = new EventEmitter<Evento>();
  @Output() cancelarEdicion = new EventEmitter<void>();
  @ViewChild('mapaCrear') mapContainer: ElementRef | undefined;
  evento: EventoClase;
  estado_id: number = 1; 

  imagenSeleccionada: File | null = null;
  imagenPrevisualizacion: string | any = null;

  textosEditarEvento: any = {}; 
  idiomaActual: string = 'es'; 

  private map: Map | undefined;
  private marker: Marker | undefined;
  private destroy$ = new Subject<void>();
  private direccionInputValue = new Subject<string>();

  constructor(
    private eventosService: ServiciosEventosService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private traduccionesService: TraduccionesService
  ) {
    this.evento = new EventoClase( 
      '', //titulo
      '', //categoria
      '', //direccion
      '', //fecha_inicio
      '', //fecha_fin
      41.655, //latitud
      -4.724 //longitud
    );
   }

  cargarTextosEditarEvento(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosEditarEvento = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de editar evento', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosEditarEvento('textos_editar_eventos');
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
    this.cargarTextosEditarEvento('textos_editar_eventos');
    this.route.paramMap.pipe(
      switchMap(params => {
        const eventoId = params.get('id');
        if (eventoId) {
          return this.eventosService.obtenerEventoPorId(+eventoId);
        } else {
          return [null];
        }
      })
    ).subscribe(eventoDesdeServicio => {
      if (eventoDesdeServicio) {
        this.evento = new EventoClase(
          eventoDesdeServicio.titulo,
          eventoDesdeServicio.categoria,
          eventoDesdeServicio.direccion,
          eventoDesdeServicio.fecha_inicio,
          eventoDesdeServicio.fecha_fin,
          eventoDesdeServicio.latitud,
          eventoDesdeServicio.longitud,
          eventoDesdeServicio.id,
          eventoDesdeServicio.descripcion,
          eventoDesdeServicio.imagen_portada,
          eventoDesdeServicio.estado_id
        );
        this.estado_id = this.evento.estado_id || 1;
        this.imagenPrevisualizacion = eventoDesdeServicio.image_preview;

        if (this.map) {
          this.updateMapView();
          this.updateMarkerPosition();
        }
      } else {
        this.inicializarFormularioNuevo();
        if (this.map) {
          this.updateMapView();
          this.updateMarkerPosition();
        }
      }
    });
    this.setupDireccionDebounce();
    this.imagenPrevisualizacion = this.evento.imagen_portada;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormularioNuevo(): void {
    this.evento = new EventoClase( 
      '',
      '',
      '',
      '',
      '',
      41.655,
      -4.724,
      undefined,
      undefined,
      '',
      1
    );
  }

  onFileSelected(event: any): void {
    this.imagenSeleccionada = event.target.files[0] as File;
    this.evento.imagen_portada = this.imagenSeleccionada;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPrevisualizacion = e.target.result as string;
    };
    reader.readAsDataURL(this.imagenSeleccionada);
  }

  onSubmit(): void {
    if (this.evento.id) {
      const formData = new FormData();
      formData.append('id', this.evento.id.toString());
      formData.append('titulo', this.evento.titulo);
      formData.append('descripcion', this.evento.descripcion || '');
      formData.append('categoria', this.evento.categoria);
      formData.append('direccion', this.evento.direccion);
      formData.append('fecha_inicio', this.evento.fecha_inicio);
      formData.append('fecha_fin', this.evento.fecha_fin);
      formData.append('latitud', this.evento.latitud.toString());
      formData.append('longitud', this.evento.longitud.toString());

      if (this.imagenSeleccionada) {
        formData.append('imagen_portada', this.imagenSeleccionada, this.imagenSeleccionada.name);
      } else if (this.evento.imagen_portada && typeof this.evento.imagen_portada === 'string') {
        formData.append('imagen_existente', this.evento.imagen_portada);
      }

      this.eventosService.actualizarEvento(this.evento.id, formData).subscribe(
        (respuesta) => {
          console.log('Evento actualizado con éxito:', respuesta);
          this.guardarEvento.emit(this.evento);
          this.resetFormulario();
        },
        (error) => {
          console.error('Error al actualizar el evento:', error);
        }
      );
    } else {
      console.error('No se puede guardar el evento porque no tiene un ID (esto no debería pasar en la edición).');
    }
  }

  onCancelar(): void {
    this.cancelarEdicion.emit();
    this.resetFormulario();
  }

  actualizarLatitud(lat: number): void {
    this.evento.latitud = lat;
  }

  actualizarLongitud(lng: number): void {
    this.evento.longitud = lng;
  }

  private initMap(): void {
    if (this.mapContainer) {
      const initialLatLng = new LatLng(this.evento.latitud, this.evento.longitud); 
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
          this.evento.latitud = newLatLng.lat;
          this.evento.longitud = newLatLng.lng;
          console.log('Nueva latitud (drag):', this.evento.latitud, 'Nueva longitud (drag):', this.evento.longitud);
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
      } else {
        console.warn('Dirección demasiado corta para geocodificar.');
      }
    });
  }

  onDireccionInput(event: any) {
    this.direccionInputValue.next(event.target.value);
  }

  geocodeAddress(address: string) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}, Valladolid, Spain&format=json&limit=1`;

    this.http.get<any[]>(nominatimUrl).pipe(takeUntil(this.destroy$)).subscribe(
      (results) => {
        if (results && results.length > 0) {
          this.evento.latitud = parseFloat(results[0].lat);
          this.evento.longitud = parseFloat(results[0].lon);
          console.log('Coordenadas obtenidas (geocode): Latitud:', this.evento.latitud, 'Longitud:', this.evento.longitud);
          this.updateMarkerPosition();
          this.updateMapView();
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
          this.evento.direccion = data.display_name;
          console.log('Dirección obtenida (reversa):', this.evento.direccion);
        } else {
          this.evento.direccion = 'Dirección no encontrada';
          console.warn('No se pudo obtener la dirección para estas coordenadas.');
        }
      },
      (error) => {
        this.evento.direccion = 'Error al obtener la dirección';
        console.error('Error en la geocodificación inversa:', error);
      }
    );
  }

  updateMarkerPosition() {
    if (this.map && this.marker) {
      const coordenadas = this.evento.obtenerCoordenadas();
      console.log('estas son las coordendas' + coordenadas);
      const newLatLng = new LatLng(coordenadas.lat, coordenadas.lng);
      this.marker.setLatLng(newLatLng);
    }
  }

  updateMapView() {
    if (this.map) {
      this.map.setView([this.evento.latitud, this.evento.longitud], 13);
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    }
  }

  resetFormulario(): void {
    this.evento = new EventoClase( 
      '',
      '',
      '',
      '',
      '',
      41.655,
      -4.724,
      undefined,
      undefined,
      ''
    );
    this.imagenSeleccionada = null;
    this.resetMapView();
  }

  resetMapView(): void {
    if (this.map && this.mapContainer) {
      this.map.setView([41.655, -4.724], 13); 
      if (this.marker) {
        this.marker.setLatLng([41.655, -4.724]); 
      }
    }
  }
}