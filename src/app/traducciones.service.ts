import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TraduccionesService {
  private baseUrl = 'http://localhost/datatfg/traducciones/obtener_textos.php';
 //private baseUrl = './datatfg/traducciones/obtener_textos.php'; // URL del script PHP

  constructor(private http: HttpClient) { }

  getTextosArrive(nombreArchivo: string): Observable<{ [key: string]: { [key: string]: string } }> {
    const params = { archivo: nombreArchivo };
    return this.http.get<any>(this.baseUrl, { params });
  }
}
