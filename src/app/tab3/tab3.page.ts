import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { 
  personOutline, mailOutline, notificationsOutline, 
  shieldCheckmarkOutline, eyeOffOutline, chatbubbleEllipsesOutline, 
  settingsOutline, logOutOutline, lockClosed, calendarOutline, 
  chevronForwardOutline, trashOutline, shieldOutline, constructOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab3Page {

  usuario = {
    nombre: 'Cargando...',
    correo: '...',
    inicial: '',
    sesiones: 0,
    dialogos: 0,
    fechaActual: ''
  };

  configuraciones = [
    { titulo: 'Notificaciones', subtitulo: 'Gestiona tus alertas', icono: 'notifications-outline' },
    { titulo: 'Privacidad y Datos', subtitulo: 'Control de tu información', icono: 'shield-checkmark-outline' },
    { titulo: 'Historial Anónimo', subtitulo: 'Ver diálogos pasados', icono: 'eye-off-outline' },
    { titulo: 'Preferencias de Chat', subtitulo: 'Personaliza tu IA', icono: 'chatbubble-ellipses-outline' },
    { titulo: 'Configuración General', subtitulo: 'Ajustes de la aplicación', icono: 'settings-outline' }
  ];

  // Modales
  modalNotificacionesAbierto = false;
  modalPrivacidadAbierto = false;
  modalHistorialAbierto = false;
  modalChatAbierto = false;
  modalGeneralAbierto = false;


  prefsChat = {
    tono: 'empatico', // Opciones: empatico, directo, motivador
    longitud: 'normal' // Opciones: breve, normal, detallada
  };


  prefsNotificaciones = {
    citas: true,
    mensajesIA: true,
    alertasBienestar: false
  };

  historialReal: any[] = [];

  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private http: HttpClient
  ) {
    addIcons({ 
      personOutline, mailOutline, notificationsOutline, 
      shieldCheckmarkOutline, eyeOffOutline, chatbubbleEllipsesOutline, 
      settingsOutline, logOutOutline, lockClosed, calendarOutline, 
      chevronForwardOutline, trashOutline, shieldOutline, constructOutline
    });
  }

  ionViewWillEnter() {
    this.cargarDatosUsuario();
    this.generarFechaActual();
    this.cargarPreferenciasNotificaciones();
  }

  cargarDatosUsuario() {
    const nombreReal = localStorage.getItem('usuarioNombre') || 'Estudiante';
    this.usuario.nombre = nombreReal;
    this.usuario.correo = localStorage.getItem('usuarioCorreo') || 'correo@ucundinamarca.edu.co';
    this.usuario.sesiones = parseInt(localStorage.getItem('usuarioSesiones') || '0');
    this.usuario.inicial = nombreReal.charAt(0).toUpperCase();
    this.usuario.dialogos = this.usuario.sesiones * 3; 
  }

  generarFechaActual() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    this.usuario.fechaActual = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
  }

  abrirConfiguracion(titulo: string) {
    if (titulo === 'Notificaciones') {
      this.modalNotificacionesAbierto = true;
    } else if (titulo === 'Privacidad y Datos') {
      this.modalPrivacidadAbierto = true;
    } else if (titulo === 'Historial Anónimo') {
      this.cargarHistorialDesdeServidor();
    } else if (titulo === 'Preferencias de Chat') {
      this.modalChatAbierto = true;
    } else if (titulo === 'Configuración General') { // <-- EL ÚLTIMO CASE
      this.modalGeneralAbierto = true;
    }
  }

  cerrarModalGeneral() {
    this.modalGeneralAbierto = false;
  }

  abrirSoporte() {
    window.open('https://www.ucundinamarca.edu.co/', '_blank');
  }

  cerrarModalChat() {
    this.modalChatAbierto = false;
  }

  guardarPreferenciasChat() {
    localStorage.setItem('prefs_chat_serena', JSON.stringify(this.prefsChat));
    // Opcional: mostrar un pequeño aviso de que se guardó
  }

  cargarPreferenciasChat() {
    const guardadas = localStorage.getItem('prefs_chat_serena');
    if (guardadas) {
      this.prefsChat = JSON.parse(guardadas);
    }
  }

  cargarHistorialDesdeServidor() {
    const correo = localStorage.getItem('usuarioCorreo');
    const apiUrl = 'https://backend-salud-t6br.onrender.com/api';

    if (!correo) return;

    this.http.get<any>(`${apiUrl}/historial-completo/${correo}`).subscribe({
      next: (res: any) => {
        this.historialReal = res.historial;
        this.modalHistorialAbierto = true;
      },
      error: (err: any) => {
        console.error('Error al cargar historial:', err);
        this.mostrarAlertaExito('No se pudo cargar el historial.');
      }
    });
  }

  // Cierres de modales
  cerrarModalHistorial() { this.modalHistorialAbierto = false; }
  cerrarModalNotificaciones() { this.modalNotificacionesAbierto = false; }
  cerrarModalPrivacidad() { this.modalPrivacidadAbierto = false; }

  async eliminarCuenta() {
    const alert = await this.alertController.create({
      header: 'Confirmar acción',
      message: '¿Estás seguro de eliminar tu cuenta? Esta acción borrará todo tu historial de SERENA.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar todo',
          role: 'destructive',
          handler: () => { this.ejecutarEliminacionTotal(); }
        }
      ]
    });
    await alert.present();
  }

  ejecutarEliminacionTotal() {
    const correo = localStorage.getItem('usuarioCorreo');
    const apiUrl = 'https://backend-salud-t6br.onrender.com/api';

    if (!correo) return;

    this.http.delete<any>(`${apiUrl}/eliminar-usuario/${correo}`).subscribe({
      next: (res: any) => {
        if (res.exito) {
          localStorage.clear();
          this.modalPrivacidadAbierto = false;
          this.router.navigate(['/login']);
          this.mostrarAlertaExito('Cuenta eliminada permanentemente.');
        }
      },
      error: (err: any) => {
        console.error('Error al borrar cuenta:', err);
      }
    });
  }

  async cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  guardarNotificaciones() {
    localStorage.setItem('prefs_notificaciones', JSON.stringify(this.prefsNotificaciones));
  }
  
  cargarPreferenciasNotificaciones() {
    const guardadas = localStorage.getItem('prefs_notificaciones');
    if (guardadas) this.prefsNotificaciones = JSON.parse(guardadas);
  }

  async mostrarAlertaExito(msj: string) {
    const toast = await this.toastController.create({
      message: msj, duration: 2000, color: 'success', position: 'bottom'
    });
    await toast.present();
  }

  async mostrarEnConstruccion(modulo: string) {
    const toast = await this.toastController.create({
      message: `${modulo} estará listo pronto.`,
      duration: 2000, color: 'warning', position: 'bottom'
    });
    await toast.present();
  }
}