import { AbstractControl, ValidationErrors } from '@angular/forms';

export class ValidacionesPropias {
    /**
     * Valida que la contraseña tenga al menos 9 caracteres, una miniscula, una mayuscula y un digito.
     * @param control Control de formulario a validar.
     * @returns Un objeto con la propiedad 'contrasenas' en true si no cumple las condiciones,
     *          null en caso contrario.
     */
    static contrasenas(control: AbstractControl): ValidationErrors| null{
        let contrasena = control.value;
        //regexp para coporbar que la contraseña (debe ocntar con 9 caracteres y contener una miniscula una mayuscula y una letra como minimo)
        const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{9,}$/;
        if(!regex.test(contrasena)){
            return {contrasenas: true};
        } else {
            return null;
        }
    }
}
