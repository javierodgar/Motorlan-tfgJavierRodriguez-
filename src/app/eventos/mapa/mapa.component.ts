import { Component, AfterViewInit, OnDestroy, ElementRef, NgZone, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Map, TileLayer, Marker, LatLng, Icon, PointExpression } from 'leaflet'; 
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() coords: LatLng | undefined; 
  mapId = 'map-' + Math.random().toString(36).substring(2, 15);
  mapStyle = {
    height: '200px',
    width: '100%'
  };
  private map: Map | undefined;
  private readonly destroy$ = new Subject<void>();
  private readonly direccionPorDefecto = 'Calle Júpiter 16, Valladolid, España'; 
  private readonly coordenadasPorDefecto = new LatLng(41.61857080238387, -4.7601262740718555); 
  private marker: Marker | undefined;

  constructor(private http: HttpClient, private el: ElementRef, private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    if (this.coords) {
      console.log('Inicializando mapa con coordenadas recibidas:', this.coords);
      this.initMap(this.coords);
    } else {
      console.log('No se recibieron coordenadas, geocodificando dirección por defecto:', this.direccionPorDefecto);
      this.geocodeAndInitMap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coords'] && !changes['coords'].firstChange) {
      console.log('Coordenadas recibidas en ngOnChanges:', changes['coords'].currentValue);
      this.updateMap(changes['coords'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private updateMap(newCoords: LatLng): void {
    if (this.map) {
      this.map.setView(newCoords, this.map.getZoom());
      this.updateMarkerPosition(newCoords);
    }
  }
  private updateMarkerPosition(newCoords: LatLng): void {
    if (this.marker) {
      this.marker.setLatLng(newCoords);
    } else if (this.map) {
      this.addMarker(newCoords); 
    }
  }

  private geocodeAndInitMap(): void {
    this.geocodeAddress(this.direccionPorDefecto).pipe(takeUntil(this.destroy$)).subscribe(
      coords => {
        console.log('Coordenadas obtenidas (geocode):', coords);
        if (coords) {
          this.initMap(coords);
        } else {
          console.warn('No se pudieron obtener las coordenadas para la dirección por defecto, usando coordenadas por defecto.');
          this.initMap(this.coordenadasPorDefecto);
        }
      },
      (error) => {
        console.error('Error en la geocodificación:', error);
        this.initMap(this.coordenadasPorDefecto); 
      }
    );
  }

  private initMap(coords: LatLng): void {
    const mapElement = this.el.nativeElement.querySelector(`#${this.mapId}`);
    if (mapElement) {
      this.map = new Map(mapElement).setView(coords, 16);

      new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.addMarker(coords);

      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.map?.invalidateSize();
        }, 100); 
      });
    } else {
      console.error('Error: No se encontró el elemento del mapa en el DOM.');
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

      this.marker = new Marker(coords, { icon: customIcon }).addTo(this.map);
    } else {
      console.warn('El mapa no está inicializado, no se puede añadir el marcador.');
    }
  }

  private geocodeAddress(address: string) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}, Valladolid, Spain&format=json&limit=1`;
    return this.http.get<any[]>(nominatimUrl).pipe(
      map(results => {
        if (results && results.length > 0) {
          return new LatLng(parseFloat(results[0].lat), parseFloat(results[0].lon));
        }
        return null;
      })
    );
  }
}