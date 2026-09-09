import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- Importamos la herramienta para la API

/**
 * @component LoginPage
 * @description Página de autenticación y registro de la aplicación SERENA.
 *
 * Actúa como única vista de entrada antes de acceder a las pestañas principales.
 * Maneja dos modos en una sola pantalla:
 * - **Inicio de sesión** (`isLogin = true`): valida credenciales contra el backend y
 *   persiste los datos del usuario en `localStorage`.
 * - **Registro** (`isLogin = false`): crea una nueva cuenta y redirige al modo login
 *   automáticamente tras el éxito.
 *
 * La validación de dominio (`@ucundinamarca.edu.co`) restringe el acceso exclusivamente
 * a estudiantes de la Universidad de Cundinamarca (UDEC). Esto se valida tanto aquí
 * (validación de UI rápida) como en el backend (validación autoritativa).
 *
 * @selector app-login
 * @template login.page.html
 * @standalone true
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {
  /**
   * Controla qué formulario se muestra en la vista.
   * - `true`: formulario de inicio de sesión.
   * - `false`: formulario de registro.
   */
  isLogin = true; 

  // --- Campos del formulario de Login ---
  /** Correo electrónico ingresado en el formulario de inicio de sesión. */
  correoLogin: string = '';
  /** Contraseña ingresada en el formulario de inicio de sesión. */
  passwordLogin: string = '';

  // --- Campos del formulario de Registro ---
  /** Nombre completo del nuevo usuario. */
  nombreReg: string = '';
  /** Correo institucional del nuevo usuario (debe terminar en @ucundinamarca.edu.co). */
  correoReg: string = '';
  /** Contraseña elegida por el nuevo usuario (mínimo 6 caracteres). */
  passwordReg: string = '';

  /**
   * URL base del backend FastAPI desplegado en Render.
   * Todos los endpoints de autenticación se construyen sobre esta base.
   * @private
   */
  private apiUrl = 'https://backend-salud-t6br.onrender.com/api';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient // <-- Inyectamos el HttpClient
  ) {}

  /**
   * Alterna entre el formulario de login y el de registro.
   * La vista usa `isLogin` con `*ngIf` para renderizar condicionalmente.
   */
  toggleView() {
    this.isLogin = !this.isLogin;
  }

  /**
   * Valida los campos del formulario de login y, si son correctos,
   * envía una petición POST al endpoint `/api/login` del backend.
   *
   * En caso de éxito:
   * - Persiste en `localStorage`: nombre, correo, sesiones, días activos y nivel de bienestar.
   * - Navega a `/tabs/inicio`, la pantalla principal de la aplicación.
   *
   * En caso de error de credenciales: muestra un toast con el mensaje del servidor.
   * En caso de error de red: muestra un toast de error de conexión.
   *
   * @remarks
   * La validación del dominio institucional se hace primero en el cliente
   * para ahorrar una petición de red innecesaria, pero el backend también
   * la aplica como segunda línea de defensa.
   */
  ingresar() {
    if (!this.correoLogin || !this.passwordLogin) {
      this.mostrarAlerta('Por favor, llena todos los campos.');
      return;
    }

    // Validación de dominio institucional: solo se permite @ucundinamarca.edu.co
    if (!this.correoLogin.includes('@ucundinamarca.edu.co')) {
      this.mostrarAlerta('Debes usar tu correo institucional de la UDEC.');
      return;
    }

    const datosLogin = {
      correo: this.correoLogin,
      password: this.passwordLogin
    };

    // Enviamos el POST a /api/login
    this.http.post<any>(`${this.apiUrl}/login`, datosLogin).subscribe({
      next: (respuesta) => {
        if (respuesta.exito) {
          this.mostrarAlerta(respuesta.mensaje, 'success');

          // Persistimos los datos del usuario en localStorage para que estén
          // disponibles en todas las pestañas sin hacer peticiones adicionales.
          localStorage.setItem('usuarioNombre', respuesta.datos_usuario.nombre);
          localStorage.setItem('usuarioCorreo', respuesta.datos_usuario.correo);

          // Métricas de bienestar usadas en Tab1 y Tab2 (camino 1 del flujo de usuario)
          localStorage.setItem('usuarioSesiones', respuesta.datos_usuario.sesiones.toString());
          localStorage.setItem('usuarioDias', respuesta.datos_usuario.dias_activos.toString());
          localStorage.setItem('usuarioBienestar', respuesta.datos_usuario.bienestar);

          this.correoLogin = '';
          this.passwordLogin = '';
          // ¡Conexión exitosa! Pasamos a las pestañas de SERENA
          this.router.navigate(['/tabs/inicio']);
        } else {
          // Si la contraseña está mal o no existe
          this.mostrarAlerta(respuesta.mensaje);
        }
        
      },
      error: (error) => {
        console.error('Error en el servidor:', error);
        this.mostrarAlerta('No se pudo conectar con el servidor. Revisa que esté encendido.');
      }
    });
  }

  /**
   * Valida los campos del formulario de registro y, si son correctos,
   * envía una petición POST al endpoint `/api/registro` del backend.
   *
   * Reglas de validación (en orden):
   * 1. Todos los campos deben estar completos.
   * 2. El correo debe pertenecer al dominio `@ucundinamarca.edu.co`.
   * 3. La contraseña debe tener al menos 6 caracteres.
   *
   * En caso de éxito: limpia el formulario y cambia a la vista de login
   * (`isLogin = true`) para que el usuario inicie sesión con sus nuevas credenciales.
   */
  registrar() {
    if (!this.nombreReg || !this.correoReg || !this.passwordReg) {
      this.mostrarAlerta('Todos los campos son obligatorios.');
      return;
    }

    // El registro es exclusivo para la comunidad universitaria de la UDEC
    if (!this.correoReg.includes('@ucundinamarca.edu.co')) {
      this.mostrarAlerta('El registro es exclusivo para estudiantes de la UDEC.');
      return;
    }

    if (this.passwordReg.length < 6) {
      this.mostrarAlerta('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const datosRegistro = {
      nombre: this.nombreReg,
      correo: this.correoReg,
      password: this.passwordReg
    };

    // Enviamos el POST a /api/registro
    this.http.post<any>(`${this.apiUrl}/registro`, datosRegistro).subscribe({
      next: (respuesta) => {
        if (respuesta.exito) {
          this.mostrarAlerta(respuesta.mensaje, 'success');
          // Limpiamos los campos y cambiamos a la vista de Login automáticamente
          this.nombreReg = '';
          this.correoReg = '';
          this.passwordReg = '';
          this.isLogin = true; 
        } else {
          // Si el correo ya estaba registrado
          this.mostrarAlerta(respuesta.mensaje);
        }
      },
      error: (error) => {
        console.error('Error en el servidor:', error);
        this.mostrarAlerta('No se pudo conectar con el servidor.');
      }
    });
  }

  /**
   * Muestra una notificación tipo toast en la parte inferior de la pantalla.
   *
   * Se usa como método centralizado de feedback al usuario para evitar
   * duplicar la lógica de creación de toasts en cada método.
   *
   * @param {string} mensaje - Texto a mostrar en el toast.
   * @param {string} [color='danger'] - Color semántico del toast.
   *   Valores válidos de Ionic: `'danger'`, `'success'`, `'warning'`, `'primary'`, etc.
   *   Por defecto es `'danger'` para mensajes de error.
   * @returns {Promise<void>} Promesa que resuelve cuando el toast es presentado.
   */
  async mostrarAlerta(mensaje: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}