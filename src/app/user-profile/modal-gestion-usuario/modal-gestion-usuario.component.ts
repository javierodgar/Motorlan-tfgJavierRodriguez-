import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { ServiciosService } from '../../servicios.service';
import { AlertComponent } from '../../alert/alert.component';

import { TraduccionesService } from '../../traducciones.service';



@Component({
  selector: 'app-modal-gestion-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AlertComponent],
  templateUrl: './modal-gestion-usuario.component.html',
  styleUrl: './modal-gestion-usuario.component.css'
})
export class ModalGestionUsuarioComponent implements OnChanges, OnInit {
  dataUrl = 'http://localhost/dataTFG/';

  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red';  

  passwordRegExp: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  @Input() isVisible: boolean = false;
  @Input() userData: any = null;
  @Input() usernameChangeLog: any = null;
  @Output() userUpdated = new EventEmitter<FormData>(); 
  @Output() modalClosed = new EventEmitter<void>();

  siguiendoUsuarios: { usuario: string; profile_image: string; user_id: number }[] = []; 
  bloqueadosUsuarios: { usuario: string; profile_image: string; user_id: number }[] = [];
  usuarioLogueado: string = '';

  revertMessage: string = '';
  errorMessage: string = '';

  activeTab: 'general' | 'security' | 'progress' = 'general';
  subActiveTab: 'siguiendo' | 'bloqueados' = 'siguiendo';

  textosModalGestion: any = {};
  idiomaActual: string = 'es'; 

  imagenPerfilPrevisualizacion: string | null = null;
  profileImageFile: File | null = null;

  generalForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    apellido1: new FormControl('', [Validators.required]),
    apellido2: new FormControl(''),
    correo_electronico: new FormControl('', [Validators.required, Validators.email]),
    ciudad_residencia: new FormControl('', [Validators.required]),
    profile_image: new FormControl<File | null>(null)
  });

  usernameForm = new FormGroup({
    usuarioNuevo: new FormControl('', [Validators.required])
  });

  passwordForm = new FormGroup({
    newPassword: new FormControl('', [Validators.minLength(6)]), 
    confirmNewPassword: new FormControl('')
  });
  

  constructor(
    private servicios: ServiciosService,
    private traduccionesService: TraduccionesService
  ) { }

  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextosModalGestion('textos_modal_gesion_usuario');
    this.cargarRelaciones();
    // console.log('ModalGestionUsuarioComponent - ngOnInit - userData:', this.userData.profile_image);
  }

  cargarTextosModalGestion(nombreArchivo: string) {
    this.traduccionesService.getTextosArrive(nombreArchivo).subscribe(
      data => {
        this.textosModalGestion = data[this.idiomaActual];
      },
      error => {
        console.error('Error al cargar los textos del modal de gestión de usuario', error);
      }
    );
  }

  cambiarIdioma(idioma: string) {
    this.idiomaActual = idioma;
    this.cargarTextosModalGestion('textos_modal_gesion_usuario');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData']) {
      // console.log('ModalGestionUsuarioComponent - ngOnChanges - userData:', changes['userData'].currentValue);
      // console.log('ModalGestionUsuarioComponent - asd - userlog ', this.usernameChangeLog);
      this.imagenPerfilPrevisualizacion = this.userData.profile_image;
      if (changes['userData'].currentValue) {
        this.populateForms(changes['userData'].currentValue);
      }
    }
    if (changes['isVisible'] && changes['isVisible'].currentValue && this.userData) {
      console.log('ModalGestionUsuarioComponent - ngOnChanges - isVisible:', changes['isVisible'].currentValue, 'userData:', this.userData);
      this.populateForms(this.userData);
      this.activeTab = 'general';
    }
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

  populateForms(data: any): void {
    this.generalForm.patchValue({
      nombre: data.nombre,
      apellido1: data.apellido1,
      apellido2: data.apellido2 || '',
      correo_electronico: data.correo_electronico,
      ciudad_residencia: data.ciudad_residencia,
      profile_image: null
    });
    this.usernameForm.patchValue({
      usuarioNuevo: data.usuario
    });
  }

  closeModal(): void {
    this.isVisible = false;
    this.modalClosed.emit();
    this.generalForm.reset();
    this.usernameForm.reset();
    this.passwordForm.reset();
    this.activeTab = 'general';
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.generalForm.patchValue({ profile_image: input.files[0] });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPerfilPrevisualizacion = e.target.result as string;
      };
      reader.readAsDataURL(file);

    }
  }

  async generateKeyFromUsername(username: any) {
    
    let encoder = new TextEncoder();
    let usernameBytes = encoder.encode(username);

    
    let hashBuffer = await window.crypto.subtle.digest("SHA-256", usernameBytes);

    
    return window.crypto.subtle.importKey(
      "raw", 
      hashBuffer, 
      { name: "AES-GCM" }, 
      false, 
      ["encrypt", "decrypt"] 
    );
  }

  async encryptPassword(password: any, secretKey: any) {
    let encoder = new TextEncoder();
    let passwordBytes = encoder.encode(password);

    
    let iv = new Uint8Array(12);
    iv.fill(0);

    
    let encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      secretKey,
      passwordBytes
    );

    return { encryptedData, iv };
  }

  submitGeneralForm() {
    if (this.generalForm.valid) {
      const formData = new FormData();
      formData.append('usuario', this.userData?.usuario || ''); 
      formData.append('nombre', this.generalForm.get('nombre')!.value!);
      formData.append('apellido1', this.generalForm.get('apellido1')!.value!);
      formData.append('apellido2', this.generalForm.get('apellido2')!.value || '');
      formData.append('correo_electronico', this.generalForm.get('correo_electronico')!.value!);
      formData.append('ciudad_residencia', this.generalForm.get('ciudad_residencia')!.value!);
      const imageFile = this.generalForm.get('profile_image')!.value;
      if (imageFile) {
        formData.append('profile_image', imageFile);
      }
      this.servicios.updateUserDetails(formData).subscribe({
        next: (response) => {
          this.showAlert = true;
          this.alertText = this.textosModalGestion['usermodificationSuccess']; 
          this.alertColor = 'green';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          if (response.message.includes("actualizados exitosamente")) {
            this.userUpdated.emit(new FormData()); 
          }
        },
        error: (error: any) => { 
          console.error('Error al guardar los datos generales:', error);
          if (error.status === 409 && error.error && error.error.message) {
            this.showAlert = true;
            this.alertText = this.textosModalGestion['usermodificationError']; 
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        }
      });
    }
  }
  submitUsernameForm() {
    if (this.usernameForm.valid) {
      const usernameData = {
        usuario: this.userData?.usuario || '',
        usuarioNuevo: this.usernameForm.get('usuarioNuevo')!.value!
      };
      console.log('usernameData:', usernameData);
      this.servicios.updateUserSecurity(usernameData).subscribe({
        next: (response) => {
          if (response.message.includes("actualizado exitosamente")) {
            this.showAlert = true;
            this.alertText = this.textosModalGestion['usermodificationSuccess']; 
            this.alertColor = 'green';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
            this.setCookie('username', this.usernameForm.get('usuarioNuevo')!.value!, 1);
            this.userUpdated.emit(new FormData()); 
            
          }
        },
        error: (error: any) => { 
          console.error('Error al guardar el nombre de usuario:', error);
          if (error.status === 409 && error.error && error.error.message) {
            this.showAlert = true;
            this.alertText = this.textosModalGestion['usermodificationError']; 
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
          }
        }
      });
    }
  }

  revertMyUsername(): void {
    this.revertMessage = '';
    this.errorMessage = '';

    this.servicios.revertUsername(this.userData?.usuario || '').subscribe({
      next: (response) => {
        if (response && response.message) {
          this.revertMessage = response.message;
            this.setCookie('username', this.usernameChangeLog.previousUsername, 1);
            this.userUpdated.emit(new FormData());
            this.showAlert = true;
            this.alertText = this.textosModalGestion['usermodificationSuccess']; 
            this.alertColor = 'green';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
        } else {
          this.errorMessage = 'Error al revertir el nombre de usuario.';
        }
      },
      error: (error) => {
        console.error('Error al revertir el nombre de usuario:', error);
        this.errorMessage = 'No se pudo revertir el nombre de usuario. Inténtalo de nuevo más tarde.';
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
          this.showAlert = true;
            this.alertText = this.textosModalGestion['usermodificationError'];
            this.alertColor = 'red';
            setTimeout(() => {
              this.showAlert = false;
            }, 3000);
        }
      }
    });
  }

  isPasswordValid(password: string): boolean {
    return this.passwordRegExp.test(password);
  }

  async submitPasswordForm() {

    if (this.passwordForm.valid) {
      const newPassword = this.passwordForm.get('newPassword')?.value;
      const confirmNewPassword = this.passwordForm.get('confirmNewPassword')?.value;

      if (newPassword === confirmNewPassword) {
        try {
          const userResponse = await this.servicios.getUser(this.userData?.usuario);
          if (userResponse?.data?.cof) {
            const secretKey = await this.generateKeyFromUsername(userResponse.data.cof);
            const { encryptedData } = await this.encryptPassword(newPassword!, secretKey);
            const encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
            const passwordData = {
              usuario: this.userData?.usuario || '',
              newPassword: encryptedPasswordBase64
            };

            this.servicios.updateUserPassword(passwordData).subscribe({
              next: (response) => {
                this.showAlert = true;
                this.alertText = this.textosModalGestion['usermodificationSuccess']; 
                this.alertColor = 'green';
                setTimeout(() => {
                  this.showAlert = false;
                }, 3000);
                this.passwordForm.reset();
              },
              error: (error) => {
                console.error('Error al guardar la contraseña:', error);
                this.showAlert = true;
                this.alertText = this.textosModalGestion['usermodificationError'];
                this.alertColor = 'red';
                setTimeout(() => {
                  this.showAlert = false;
                }, 3000);
              }
            });
          } 
        } catch (error) {
          console.error('Error al obtener la información del usuario:', error);
          alert('Error al intentar cambiar la contraseña.');
        }
      } else {
        this.showAlert = true;
        this.alertText = this.textosModalGestion['passwordNotMatch'];
        this.alertColor = 'red';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
      }
    }
  }

  setActiveTab(tab: 'general' | 'security' | 'progress') {
    this.activeTab = tab;
  }

  setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
  }

  cargarRelaciones() {
    this.usuarioLogueado = this.getCookie('username') || '';
    console.log('Usuario logueadoo:', this.usuarioLogueado);
    this.servicios.obtenerRelaciones(this.usuarioLogueado).subscribe(
      (response) => {
        this.siguiendoUsuarios = response.relaciones.siguiendo;
        this.bloqueadosUsuarios = response.relaciones.bloqueados;
        console.log('Siguiendo:', this.siguiendoUsuarios);
        console.log('Bloqueados:', this.bloqueadosUsuarios);
      },
      (error) => {
        console.error('Error al obtener relaciones:', error);
      }
    );
  }

  dejarDeSeguir(usuarioASeguir: string) {
    this.servicios.dejarDeSeguir(this.usuarioLogueado, usuarioASeguir).subscribe(
      (response) => {
        console.log('Dejaste de seguir a:', usuarioASeguir, response);
        this.cargarRelaciones();
      },
      (error) => {
        console.error('Error al dejar de seguir:', error);
      }
    );
  }

  desbloquearUsuario(usuarioABloquear: string) {
    this.servicios.desbloquearUsuario(this.usuarioLogueado, usuarioABloquear).subscribe(
      (response) => {
        console.log('Desbloqueaste a:', usuarioABloquear, response);
        this.cargarRelaciones(); 
      },
      (error) => {
        console.error('Error al desbloquear:', error);
      }
    );
  }

}