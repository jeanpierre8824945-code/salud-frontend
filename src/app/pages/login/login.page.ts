import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- Importamos la herramienta para la API

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {
  isLogin = true; 

  // Variables del formulario
  correoLogin: string = '';
  passwordLogin: string = '';

  nombreReg: string = '';
  correoReg: string = '';
  passwordReg: string = '';

  // La dirección de tu burbuja local de FastAPI
  private apiUrl = 'https://backend-salud-t6br.onrender.com/api';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient // <-- Inyectamos el HttpClient
  ) {}

  toggleView() {
    this.isLogin = !this.isLogin;
  }

  // --- Función para Iniciar Sesión con el Backend ---
  ingresar() {
    if (!this.correoLogin || !this.passwordLogin) {
      this.mostrarAlerta('Por favor, llena todos los campos.');
      return;
    }

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

          localStorage.setItem('usuarioNombre', respuesta.datos_usuario.nombre);
          localStorage.setItem('usuarioCorreo', respuesta.datos_usuario.correo);

          // --- NUEVAS LÍNEAS PARA EL CAMINO 1 ---
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

  // --- Función para Registrarse en el Backend ---
  registrar() {
    if (!this.nombreReg || !this.correoReg || !this.passwordReg) {
      this.mostrarAlerta('Todos los campos son obligatorios.');
      return;
    }

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