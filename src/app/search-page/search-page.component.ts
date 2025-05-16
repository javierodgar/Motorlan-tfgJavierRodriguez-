import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiciosService } from '../servicios.service'; 

import { forkJoin, Observable } from 'rxjs';

import { TraduccionesService } from '../traducciones.service';

@Component({
    selector: 'app-search-page',
    imports: [FormsModule, CommonModule],
    templateUrl: './search-page.component.html',
    styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit {
    searchTerm: string = '';
    filterOptions = [
        // { name: 'Publicaciones', value: 'publicaciones', checked: true },
        { name: 'Hashtags', value: 'hashtags', checked: true },
        { name: 'Usuarios', value: 'usuarios', checked: true },
        // { name: 'Eventos', value: 'eventos', checked: true } 
    ];
    searchResults: any[] = [];
    topHashtags: any[] = [];
    loading: boolean = false;
    error: string = '';
    sortBy: string = 'default'; 
    sortOptions = [
        { name: 'Por defecto', value: 'default' },
        { name: 'Más Likes', value: 'likes' },
        { name: 'Más Dislikes', value: 'dislikes' }
    ];
    textosBusqueda: any = {}; 
    idiomaActual: string = 'es'; 
    username: string = '';

    constructor(private searchService: ServiciosService, private router: Router, private traduccionesService: TraduccionesService) { }

    cargarTextosBusqueda(nombreArchivo: string) {
        this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
          data => {
            this.textosBusqueda = data[this.idiomaActual];
            this.filterOptions = this.filterOptions.map(option => ({
              ...option,
              name: this.textosBusqueda[`filtro${option.value}`] || option.name
            }));
            this.sortOptions = this.sortOptions.map(option => ({
              ...option,
              name: this.textosBusqueda[`ordenar${option.value}`] || option.name
            }));
          },
          error => {
            console.error('Error al cargar los textos de la página de búsqueda', error);
          }
        );
      }
    
      cambiarIdioma(idioma: string) {
        this.idiomaActual = idioma;
        this.cargarTextosBusqueda('textos_search_page');
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
        this.username = this.getCookie('username') || '';
        this.idiomaActual = this.getCookie('lang') || 'es';
        this.cargarTextosBusqueda('textos_search_page');
        this.loadTopHashtags();
    }

    loadTopHashtags() {
        this.searchService.searchHashtags('').subscribe({
            next: (data: any[]) => {
                this.topHashtags = data.filter((result: any) => result.tipo === 'hashtag')
                    .sort((a: any, b: any) => b.conteo - a.conteo);
            },
            error: (err) => {
                console.error('Error al cargar hashtags:', err);
            }
        });
    }

    onFilterChanged(option: any) {
        option.checked = !option.checked;
        this.onSearch(); 
    }

    onSortChanged(event: any) {
        this.sortBy = (event.target as HTMLSelectElement).value;
        this.onSearch(); 
    }

    

    onSearch() {
        const selectedFilters = this.filterOptions
            .filter(option => option.checked)
            .map(option => option.value);

        if (this.searchTerm.trim() === '' && selectedFilters.length === 0) {
            this.searchResults = [];
            return;
        }

        this.loading = true;
        this.error = '';
        this.searchResults = []; 

        const searchCalls: Observable<any>[] = [];

        if (selectedFilters.includes('publicaciones') || selectedFilters.length === 0) {
            searchCalls.push(this.searchService.searchPublications(this.searchTerm, this.sortBy));
        }
        if (selectedFilters.includes('hashtags')) {
            searchCalls.push(this.searchService.searchHashtags(this.searchTerm));
        }
        if (selectedFilters.includes('usuarios')) {
            searchCalls.push(this.searchService.searchUsers(this.searchTerm, this.username));
        }
        if (selectedFilters.includes('eventos')) { 
            searchCalls.push(this.searchService.searchEvents(this.searchTerm));
        }

        forkJoin(searchCalls).subscribe({
            next: (results: any[]) => {
                results.forEach(resultArray => {
                    this.searchResults = [...this.searchResults, ...resultArray];
                });
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Error al realizar la búsqueda.';
                console.error(err);
                this.loading = false;
                this.searchResults = [];
            }
        });
    }

    consoleLog(value: any, type: string) {
        if (type === 'hashtag') {
            console.log('Hashtag clicado:', value);
            this.router.navigate(['main/hastag_posts', value]);
        } else if (type === 'publicacion') {
            console.log('Publicación clicada (ID):', value);
            this.goToPost(value);
        } else if (type === 'usuario') {
            console.log('Usuario clicado:', value);
            this.showUserGeneral(value);
        } else if (type === 'follow') {
            console.log('Botón Seguir clicado:', value);
        } else if (type === 'evento') {
            console.log('Evento clicado (ID):', value);
            this.goToEvent(value);
        }
    }

    stopEvent(event: Event) {
        event.stopPropagation();
    }

    goToPost(id: number) {
        this.router.navigate(['main/big_post', id]);
    }

    showUserGeneral(username: string) {
        this.router.navigate(['main/user_general', username]);
    }

    goToEvent(id: number) {
        this.router.navigate(['main/big_event', id]);
    }

    shouldShowSortOptions(): boolean {
      const publicacionesFilter = this.filterOptions.find(opt => opt.value === 'publicaciones');
      if (publicacionesFilter) {
        return publicacionesFilter.checked;
      }
      return this.filterOptions.every(opt => !opt.checked);
    }
}