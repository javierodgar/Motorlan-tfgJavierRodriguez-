import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { ServiciosEventosService } from '../servicios-eventos.service';
import { AlertComponent } from '../alert/alert.component';
import { TraduccionesService } from '../traducciones.service';
@Component({
  selector: 'app-arrive',
  imports: [FormsModule, AlertComponent, CommonModule],
  templateUrl: './arrive.component.html',
  styleUrl: './arrive.component.css'
})
export class ArriveComponent {
  idiomaActual: string = 'es'; 
  textos!: { [key: string]: { [key: string]: string } };

  showLoginModal: boolean = false;
  showRegisterModal: boolean = false;
  
  showAlert: boolean = false;
  alertText: string = '';     
  alertColor: string = 'red'; 

  passwordRegExp: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  
  constructor (private servicios: ServiciosService, private serviciosEventos: ServiciosEventosService, private router: Router, private traduccionesService: TraduccionesService) {}
  
  ngOnInit(): void {
    this.idiomaActual = this.getCookie('lang') || 'es';
    this.cargarTextos();
  }

  cambiarIdioma(lang: string): void {
    this.idiomaActual = lang;
    this.setCookie('lang', lang, 30);
  }

  cargarTextos(): void {
    this.traduccionesService.getTextosArrive('textos_arrive').subscribe(
      data => {
        this.textos = data;
      },
      error => {
        console.error('Error al cargar los textos:', error);
        this.textos = {
          es: { mainTitle: 'Error al cargar' },
          en: { mainTitle: 'Load Error' }
        };
      }
    );
  }
  loginData = {
    username: '',
    password: ''
  };

  registerData = {
    username: '',
    firstName: '',
    lastName1: '',
    lastName2: '',
    dni: '',
    email: '',
    city: '',
    password: '',
    confirmPassword: '',
    profileImage: null as File | null
  };

  

  async  generateKeyFromUsername(username:any) {
    let encoder = new TextEncoder();
    let usernameBytes = encoder.encode(username);

    let hashBuffer = await window.crypto.subtle.digest("SHA-256", usernameBytes);

    let hashArray = Array.from(new Uint8Array(hashBuffer));
    let hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    console.log("Hash SHA-256 del nombre de usuario:", hashHex);

    return window.crypto.subtle.importKey(
        "raw", 
        hashBuffer, 
        { name: "AES-GCM" }, 
        false, 
        ["encrypt", "decrypt"] 
    );
    }
  
  async encryptPassword(password:any, secretKey:any) {
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

  
/**
 * Abre el modal de tipo especificado (login o register)
 * @param modalType tipo de modal a abrir, puede ser "login" o "register"
 */
  openModal(modalType: string) {
    if (modalType === 'login') {
      this.showLoginModal = true;
    } else if (modalType === 'register') {
      this.showRegisterModal = true;
    }
  }

  llamarActualizarEstados() {
    this.serviciosEventos.actualizarEstadosEventos().subscribe(
      (response) => {
        console.log('Respuesta de actualización de estados:', response);
        if (response && response.success) {
          console.log(response.message);
        } else if (response && response.message) {
          console.error('Error al actualizar estados desde el frontend:', response.message);
        }
      },
      (error) => {
        console.error('Error al llamar al servicio de actualización de estados:', error);
      }
    );
  }

/**
 * Closes the specified modal.
 * @param modalType - The type of modal to close, can be "login" or "register".
 */
  closeModal(modalType: string) {
    if (modalType === 'login') {
      this.showLoginModal = false;
    } else if (modalType === 'register') {
      this.showRegisterModal = false;
    }
  }

  
/**
 * Sets a cookie in the browser with a specified name, value, and expiration period.
 * 
 * @param name - The name of the cookie.
 * @param value - The value to be stored in the cookie.
 * @param days - The number of days until the cookie expires.
 */
  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
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

  /**
   * Verifica el login de un usuario.
   * Primero, se extrae la clave secreta del nombre de usuario.
   * Luego, se cifra la contraseña con esta clave secreta.
   * Se compara la contraseña cifrada con la almacenada en la base de datos.
   * Si coincide, se muestra un mensaje de login correcto, se crea una cookie con el nombre de usuario y se navega a la pantalla principal.
   * Finalmente, se cierra el modal de login.
   */
   async onLoginSubmit() {;

    const response = await this.servicios.getUser(this.loginData.username);
    
    if (response.data) {

      let secretKey = await this.generateKeyFromUsername(response.data.cof);
      console.log('cof: ', response.data.cof);
      console.log('clave secreta: ', secretKey);
      let { encryptedData, iv } = await this.encryptPassword(this.loginData.password, secretKey);
      let encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
      console.log('contrasela cifrada en tiempo real: ', encryptedPasswordBase64);
      console.log('contraseña de la base de datos: ', response.data.encryptedPassword);

      if(response.data.encryptedPassword === encryptedPasswordBase64){
        console.log('Login correcto');
        this.llamarActualizarEstados();
        this.setCookie('username', this.loginData.username, 1);
        this.router.navigate([`/main/posts`])
      } else {
        this.showAlert = true;
          this.alertText = this.textos[this.idiomaActual]['loginMessage'] || 'Login Error'; 
          this.alertColor = 'red'; 
          setTimeout(() => {
            this.showAlert = false; 
          }, 3000); 
      }
    } else {
          this.showAlert = true;
          this.alertText = this.textos[this.idiomaActual]['loginMessage'] || 'Login Error'; 
          this.alertColor = 'red'; 
          setTimeout(() => {
            this.showAlert = false; 
          }, 3000); 
      if (response.error) {
        console.error('Detalles del error:', response.error);
      }
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
        this.registerData.profileImage = file;
    }
  }

  isPasswordValid(password: string): boolean {
    return this.passwordRegExp.test(password);
  }

   validarYLimpiarDni(dniConOLetra: string): { numero: string | null; letraOriginal: string | null; valido: boolean } {
    const letras = "TRWAGMYFPDXBNJZSQVHLCKE";
    const dniSoloNumeros = dniConOLetra.replace(/[^0-9]/g, '');
    const letraCapturada = dniConOLetra.replace(/[0-9-]/g, '').toUpperCase(); 
  
    if (dniSoloNumeros.length !== 8) {
      
      return { numero: null, letraOriginal: null, valido: false };
    }
  
    const numero = parseInt(dniSoloNumeros, 10);
    if (isNaN(numero) || numero < 1 || numero > 99999999) {
    return { numero: null, letraOriginal: null, valido: false };
    }
  
    const residuo = numero % 23;
    const letraCalculada = letras.charAt(residuo);
  
    if (letraCapturada && letraCapturada.length === 1 && letraCapturada !== letraCalculada) {
      return { numero: dniSoloNumeros, letraOriginal: letraCapturada, valido: false };
    }
  
    return { numero: dniSoloNumeros, letraOriginal: letraCapturada || null, valido: true };
  }

  async onRegisterSubmit() {
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.showAlert = true;
      this.alertText = this.textos[this.idiomaActual]['passwordsMismatchRegister'];
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
      return; 
    }

    if (!this.isPasswordValid(this.registerData.password)) {
      this.showAlert = true;
      this.alertText = this.textos[this.idiomaActual]['passwordValidationRegister'];
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
      return; 
    }

    const dniResultado = this.validarYLimpiarDni(this.registerData.dni);
    if (!dniResultado.valido) {
      this.showAlert = true;
      this.alertText = this.textos[this.idiomaActual]['registerMessageDni'];
      this.alertColor = 'red';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
        return; 
    }

    let secretKey = await this.generateKeyFromUsername(this.registerData.username);
    let { encryptedData, iv } = await this.encryptPassword(this.registerData.password, secretKey);
    let encryptedPasswordBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));

    const formData = new FormData();
    formData.append('username', this.registerData.username);
    formData.append('firstName', this.registerData.firstName);
    formData.append('lastName', this.registerData.lastName1);
    formData.append('lastName2', this.registerData.lastName2 || '');
    formData.append('dni', this.registerData.dni);
    formData.append('city', this.registerData.city);
    formData.append('email', this.registerData.email);
    formData.append('encryptedPassword', encryptedPasswordBase64);

    if (this.registerData.profileImage) {
      formData.append('profileImage', this.registerData.profileImage, this.registerData.profileImage.name);
    }

    console.log('FormData:', formData);

    try {
      const response = await this.servicios.register(formData).toPromise();
      console.log('Register Respuesta:', response);
      this.showAlert = true;
      this.alertText = this.textos[this.idiomaActual]['registerExito'];
      this.alertColor = 'green';
      setTimeout(() => {
        this.showAlert = false;
      }, 3000);
      this.closeModal('register');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Error al registrar:', error);
      if (error.status === 409 && error.error && error.error.message) {
        if(error.error.message === 'Error: El DNI ya está registrado'){
          this.showAlert = true;
          this.alertText = this.textos[this.idiomaActual]['registerDniFail']; 
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        }else if(error.error.message === 'Error: El nombre de usuario ya está en uso'){
          this.showAlert = true;
          this.alertText = this.textos[this.idiomaActual]['registerUserFail1']; 
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        } else if(error.error.message === 'El nombre de usuario se encuentre reservado por un cambio reciente'){
          this.showAlert = true;
          this.alertText = this.textos[this.idiomaActual]['registerUserFail2']; 
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        } else if(error.error.message === 'Error: El correo electrónico ya está registrado'){
          this.showAlert = true;
          this.alertText = this.textos[this.idiomaActual]['registerMailFail']; 
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        } else {
          this.showAlert = true;
          this.alertText = error.error.message; 
          this.alertColor = 'red';
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
        }
        
      } else {
        this.showAlert = true;
        this.alertText = this.textos[this.idiomaActual]['fatalError']; 
        this.alertColor = 'red';
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
      }
    }
  }
}
