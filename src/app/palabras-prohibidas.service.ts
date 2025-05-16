import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PalabrasProhibidasService {

  private offensiveWords: string[] = [];
  private url = 'http://localhost/dataTFG/detectorpalabras/get_palabras.php';
  constructor(private http: HttpClient) {
    this.loadOffensiveWordsFromServer();
  }

private loadOffensiveWordsFromServer(): void {
    this.http.get<{ espanol?: { insultos?: string[] }; error?: string }>(this.url)
      .pipe(
        map(response => {
          if (response?.espanol?.insultos) {
            return response.espanol.insultos.map(word => word.toLowerCase());
          }
          console.error('Error al cargar la lista de palabras ofensivas desde el servidor: formato incorrecto o no se encontraron datos.');
          return [];
        }),
        catchError(error => {
          console.error('Error al cargar la lista de palabras ofensivas desde el servidor:', error);
          return of([]);
        })
      )
      .subscribe(words => {
        this.offensiveWords = words;
      });
  }

  containsOffensiveWord(text: string): Observable<boolean> {
    return of(this.offensiveWords.some(word => text.toLowerCase().includes(word)));
  }
}
