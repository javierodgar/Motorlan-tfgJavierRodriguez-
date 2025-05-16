import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiciosService } from '../../../servicios.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AlertComponent } from '../../../alert/alert.component';
import { forkJoin } from 'rxjs';
import {tap, of, switchMap, catchError } from 'rxjs';
import { PalabrasProhibidasService } from '../../../palabras-prohibidas.service';
import { TraduccionesService } from '../../../traducciones.service';
@Component({
  selector: 'app-editar-post',
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  templateUrl: './editar-post.component.html',
  styleUrl: './editar-post.component.css'
})
export class EditarPostComponent implements OnInit {
  postId: number | null = null;
  postForm: FormGroup;
  post: any;
  selectedFile: File | null = null;
  selectedHashtags: string[] = [];
  @ViewChild('hashtagInput') hashtagInput!: ElementRef;

  imagePreview: string | ArrayBuffer | null = null;

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red';  

  textosEditarPost: any = {}; 
  idiomaActual: string = 'es'; 

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private postService: ServiciosService,
    private offensiveWordChecker: PalabrasProhibidasService,
    private traduccionesService: TraduccionesService
  ) {
    this.postForm = this.formBuilder.group({
      titulo: ['', Validators.required],
      imagen: [null], 
      texto: ['', Validators.required],
      hashtags: ['']
    });
  }

  cargarTextosEditarPost(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosEditarPost = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos de editar post', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosEditarPost('textos_editar_post');
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
    this.cargarTextosEditarPost('textos_editar_post');
    this.route.params.subscribe(params => {
      this.postId = +params['id'];
      if (this.postId) {
        this.cargarPost(this.postId);
      }
    });
  }

  addHashtagFromInput() {
    const inputValue = this.hashtagInput.nativeElement.value;
    const trimmedTag = inputValue.trim();
    if (trimmedTag && !this.selectedHashtags.includes(trimmedTag)) {
      const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      this.selectedHashtags.push(formattedTag);
    }
    this.hashtagInput.nativeElement.value = ''; 
  }

  removeSelectedHashtag(hashtagToRemove: string) {
    this.selectedHashtags = this.selectedHashtags.filter(hashtag => hashtag !== hashtagToRemove);
  }

  

  cargarPost(id: number): void {
    this.postService.getPostById(id).subscribe(
      (post) => {
        this.post = post;
        this.postForm.patchValue({
          titulo: post.titulo,
          texto: post.texto,
        });
        this.selectedHashtags = post.hashtags || [];

      },
      (error) => {
        console.error('Error al cargar el post:', error);
      }
    );
  }
   onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result ?? null;
      };
      if (this.selectedFile) { 
        reader.readAsDataURL(this.selectedFile);
      }
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
    }
  }
  

  guardarCambios(): void {
    if (this.postForm.valid && this.postId && this.post) {
      const tituloValue: string = this.postForm.value.titulo;
      const textoValue: string = this.postForm.value.texto;
  
      forkJoin([
        this.offensiveWordChecker.containsOffensiveWord(tituloValue),
        this.offensiveWordChecker.containsOffensiveWord(textoValue)
      ]).pipe(
        tap(([isTituloOffensive, isTextoOffensive]) => {
          if (isTituloOffensive || isTextoOffensive) {
            this.showAlert = true;
            this.alertText = 'El título o el texto de la publicación contiene palabras ofensivas. Por favor, revísalo.';
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
            throw new Error('Contenido ofensivo detectado'); 
          }
          this.showAlert = false;
        }),
        switchMap(() => {
          const formData = new FormData();
          formData.append('id', String(this.postId));
          formData.append('usuario', this.post.usuario);
          formData.append('titulo', tituloValue);
          formData.append('texto', textoValue);
          formData.append('hashtags', this.selectedHashtags.join(','));
          formData.append('fecha_creacion', this.post.fecha_creacion);
  
          if (this.selectedFile) {
            formData.append('imagen', this.selectedFile, this.selectedFile.name);
          } else if (this.post.imagen) {
            formData.append('imagen_existente', this.post.imagen);
          }
  
          if (this.postId) {
            return this.postService.actualizarPost(this.postId, formData);
          } else {
            console.error('postId es null. No se puede actualizar el post.');
            return of(null);
          }
        }),
        catchError(error => {
          if (error?.message === 'Contenido ofensivo detectado') {
            return of(null); 
          }
          console.error('Error al actualizar el post:', error);
          this.showAlert = true;
          this.alertText = 'Error al actualizar el post.';
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          return of(null);
        })
      ).subscribe(
        (response) => {
          if (response) {
            console.log('Post actualizado con éxito:', response);
            this.showAlert = true;
            this.alertText = 'Post actualizado con éxito!';
            this.alertColor = 'green';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        },
        (error) => {
          if (error?.message !== 'Contenido ofensivo detectado') {
            console.error('Error en la suscripción al actualizar el post:', error);
          }
        }
      );
    } else {
      console.log('Formulario inválido o falta información del post.');
    }
  }
}
