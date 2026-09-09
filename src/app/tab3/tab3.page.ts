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

/**
 * @component Tab3Page
 * @description Pestaña de Perfil y Configuración del usuario en SERENA.
 *
 * Centraliza la gestión de la cuenta y las preferencias personales:
 *
 * - **Tarjeta de perfil**: muestra nombre, inicial, correo, sesiones totales y
 *   un contador de diálogos estimado (sesiones × 3).
 * - **Módulo de Notificaciones**: preferencias sobre alertas de citas, mensajes de IA
 *   y bienestar, persistidas en `localStorage` bajo la clave `prefs_notificaciones`.
 * - **Módulo de Privacidad**: vista de política de datos y acción de eliminación de cuenta
 *   con doble confirmación (diálogo nativo de Ionic antes de llamar al backend).
 * - **Historial Anónimo**: carga y muestra el historial de conversaciones desde el servidor.
 * - **Preferencias de Chat**: permite personalizar el `tono` (`empático`, `directo`,
 *   `motivador`) y la `longitud` de respuestas de la IA. Se guarda en `prefs_chat_serena`
 *   en `localStorage` y es leído por `Tab1Page.enviarMensaje()` en cada petición.
 * - **Configuración General**: enlace de soporte y opciones generales de la app.
 * - **Cierre de sesión**: limpia `localStorage` y navega al login.
 *
 * @selector app-tab3
 * @template tab3.page.html
 * @standalone true
 */
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab3Page {

  /**
   * Datos del perfil del usuario activo.
   * - `nombre`: nombre completo persistido en login.
   * - `correo`: correo institucional persistido en login.
   * - `inicial`: primera letra mayúscula del nombre, usada para el avatar.
   * - `sesiones`: número total de sesiones (tests + chats completados).
   * - `dialogos`: estimación de mensajes totales (calculado como sesiones × 3).
   * - `fechaActual`: mes y año actuales formateados en español.
   */
  usuario = {
    nombre: 'Cargando...',
    correo: '...',
    inicial: '',
    sesiones: 0,
    dialogos: 0,
    fechaActual: ''
  };

  /**
   * Lista de opciones del menú de configuración.
   * Cada ítem activa un modal diferente según su `titulo`, gestionado
   * centralmente por el método `abrirConfiguracion()`.
   */
  configuraciones = [
    { titulo: 'Notificaciones', subtitulo: 'Gestiona tus alertas', icono: 'notifications-outline' },
    { titulo: 'Privacidad y Datos', subtitulo: 'Control de tu información', icono: 'shield-checkmark-outline' },
    { titulo: 'Historial Anónimo', subtitulo: 'Ver diálogos pasados', icono: 'eye-off-outline' },
    { titulo: 'Preferencias de Chat', subtitulo: 'Personaliza tu IA', icono: 'chatbubble-ellipses-outline' },
    { titulo: 'Configuración General', subtitulo: 'Ajustes de la aplicación', icono: 'settings-outline' }
  ];

  // --- Flags de visibilidad de modales (uno por sección de configuración) ---
  /** `true` cuando el modal de configuración de notificaciones está abierto. */
  modalNotificacionesAbierto = false;
  /** `true` cuando el modal de privacidad y datos está abierto. */
  modalPrivacidadAbierto = false;
  /** `true` cuando el modal de historial anónimo está abierto. */
  modalHistorialAbierto = false;
  /** `true` cuando el modal de preferencias del chat IA está abierto. */
  modalChatAbierto = false;
  /** `true` cuando el modal de configuración general está abierto. */
  modalGeneralAbierto = false;

  /**
   * Preferencias de comportamiento del chat con la IA.
   * - `tono`: estilo de comunicación de la IA. Opciones: `'empatico'`, `'directo'`, `'motivador'`.
   * - `longitud`: extensión de las respuestas. Opciones: `'breve'`, `'normal'`, `'detallada'`.
   * Se persiste en `localStorage['prefs_chat_serena']` y es leído por `Tab1Page`.
   */
  prefsChat = {
    tono: 'empatico',
    longitud: 'normal'
  };

  /**
   * Preferencias de notificaciones del usuario.
   * Se persisten en `localStorage['prefs_notificaciones']`.
   */
  prefsNotificaciones = {
    citas: true,
    mensajesIA: true,
    alertasBienestar: false
  };

  /** Historial de conversaciones cargado desde el servidor para el modal de historial. */
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

  /**
   * Hook de ciclo de vida de Ionic. Se ejecuta cada vez que el usuario
   * navega hacia esta pestaña.
   * Carga los datos del perfil, genera la fecha formateada y recupera
   * las preferencias de notificaciones guardadas.
   */
  ionViewWillEnter() {
    this.cargarDatosUsuario();
    this.generarFechaActual();
    this.cargarPreferenciasNotificaciones();
  }

  /**
   * Lee los datos del usuario desde `localStorage` y los asigna al objeto `usuario`.
   *
   * @remarks
   * `dialogos` se estima multiplicando las sesiones por 3, bajo la suposición de
   * que cada sesión implica aproximadamente 3 intercambios de mensajes. Es un valor
   * orientativo, no una cifra exacta almacenada en el backend.
   */
  cargarDatosUsuario() {
    const nombreReal = localStorage.getItem('usuarioNombre') || 'Estudiante';
    this.usuario.nombre = nombreReal;
    this.usuario.correo = localStorage.getItem('usuarioCorreo') || 'correo@ucundinamarca.edu.co';
    this.usuario.sesiones = parseInt(localStorage.getItem('usuarioSesiones') || '0');
    // Extraemos la inicial para el avatar circular (ej.: "Jean Pierre" → "J")
    this.usuario.inicial = nombreReal.charAt(0).toUpperCase();
    // Estimación de mensajes totales basada en el promedio de intercambios por sesión
    this.usuario.dialogos = this.usuario.sesiones * 3; 
  }

  /**
   * Genera una cadena legible con el mes y año actuales en español.
   * Se usa como indicador de "período activo" en la tarjeta de perfil.
   *
   * @example
   * // Resultado: "Septiembre 2026"
   */
  generarFechaActual() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    this.usuario.fechaActual = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
  }

  /**
   * Enrutador central de las opciones del menú de configuración.
   * Activa el modal correspondiente según el título del ítem tocado.
   * Para "Historial Anónimo", primero carga los datos del servidor antes de abrir el modal.
   *
   * @param {string} titulo - Título del ítem de configuración seleccionado.
   */
  abrirConfiguracion(titulo: string) {
    if (titulo === 'Notificaciones') {
      this.modalNotificacionesAbierto = true;
    } else if (titulo === 'Privacidad y Datos') {
      this.modalPrivacidadAbierto = true;
    } else if (titulo === 'Historial Anónimo') {
      // Cargamos primero el historial desde el servidor; el modal se abre dentro del callback
      this.cargarHistorialDesdeServidor();
    } else if (titulo === 'Preferencias de Chat') {
      this.modalChatAbierto = true;
    } else if (titulo === 'Configuración General') {
      this.modalGeneralAbierto = true;
    }
  }

  /** Cierra el modal de configuración general. */
  cerrarModalGeneral() {
    this.modalGeneralAbierto = false;
  }

  /**
   * Abre el sitio web de soporte de la UDEC en el navegador externo.
   * Usa `'_blank'` (no `'_system'`) porque no necesita el manejo nativo de Capacitor.
   */
  abrirSoporte() {
    window.open('https://www.ucundinamarca.edu.co/', '_blank');
  }

  /** Cierra el modal de preferencias del chat. */
  cerrarModalChat() {
    this.modalChatAbierto = false;
  }

  /**
   * Persiste las preferencias del chat en `localStorage`.
   * Estas preferencias son leídas en tiempo real por `Tab1Page.enviarMensaje()`
   * al construir cada petición al endpoint `/api/chat`.
   */
  guardarPreferenciasChat() {
    localStorage.setItem('prefs_chat_serena', JSON.stringify(this.prefsChat));
    // Opcional: mostrar un pequeño aviso de que se guardó
  }

  /**
   * Carga las preferencias del chat guardadas en `localStorage` y las aplica
   * al objeto `prefsChat`, sincronizando la UI del modal con los valores persistidos.
   */
  cargarPreferenciasChat() {
    const guardadas = localStorage.getItem('prefs_chat_serena');
    if (guardadas) {
      this.prefsChat = JSON.parse(guardadas);
    }
  }

  /**
   * Solicita al servidor el historial completo de conversaciones del usuario
   * y, si la petición es exitosa, abre el modal del historial con los datos recibidos.
   *
   * @remarks
   * El historial se denomina "anónimo" porque en el backend los mensajes no incluyen
   * datos de identificación personal más allá del correo usado como clave.
   */
  cargarHistorialDesdeServidor() {
    const correo = localStorage.getItem('usuarioCorreo');
    const apiUrl = 'https://backend-salud-t6br.onrender.com/api';

    if (!correo) return;

    this.http.get<any>(`${apiUrl}/historial-completo/${correo}`).subscribe({
      next: (res: any) => {
        this.historialReal = res.historial;
        // Abrimos el modal solo después de tener los datos, evitando mostrar una lista vacía
        this.modalHistorialAbierto = true;
      },
      error: (err: any) => {
        console.error('Error al cargar historial:', err);
        this.mostrarAlertaExito('No se pudo cargar el historial.');
      }
    });
  }

  // --- Cierre de modales individuales ---
  /** Cierra el modal del historial anónimo. */
  cerrarModalHistorial() { this.modalHistorialAbierto = false; }
  /** Cierra el modal de notificaciones. */
  cerrarModalNotificaciones() { this.modalNotificacionesAbierto = false; }
  /** Cierra el modal de privacidad. */
  cerrarModalPrivacidad() { this.modalPrivacidadAbierto = false; }

  /**
   * Muestra un diálogo de confirmación nativo de Ionic antes de eliminar la cuenta.
   * La eliminación es irreversible: borra el usuario y todo su historial del backend.
   *
   * Se usa un doble paso (diálogo → handler) para prevenir eliminaciones accidentales
   * por un toque involuntario en dispositivos táctiles.
   *
   * @returns {Promise<void>} Promesa que resuelve cuando el diálogo es presentado.
   */
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

  /**
   * Ejecuta la eliminación permanente de la cuenta vía DELETE `/api/eliminar-usuario/{correo}`.
   *
   * Tras una respuesta exitosa:
   * - Limpia completamente `localStorage` para eliminar todos los datos de sesión.
   * - Cierra el modal de privacidad.
   * - Navega al login para evitar que el usuario quede en un estado inconsistente.
   * - Muestra un toast de confirmación.
   *
   * @remarks
   * Este método no debe llamarse directamente; siempre debe invocarse a través de
   * `eliminarCuenta()` que muestra el diálogo de confirmación previo.
   */
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

  /**
   * Cierra la sesión del usuario limpiando todos los datos de `localStorage`
   * y redirigiendo a la pantalla de login.
   *
   * @remarks
   * No realiza ninguna petición al backend porque los tokens de sesión son
   * stateless (basados en localStorage). Basta con borrar el almacenamiento local.
   *
   * @returns {Promise<void>}
   */
  async cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  /**
   * Persiste las preferencias de notificaciones en `localStorage`.
   * Se llama cada vez que el usuario cambia un toggle en el modal de notificaciones.
   */
  guardarNotificaciones() {
    localStorage.setItem('prefs_notificaciones', JSON.stringify(this.prefsNotificaciones));
  }
  
  /**
   * Carga las preferencias de notificaciones guardadas en `localStorage` y las
   * aplica al objeto `prefsNotificaciones`, sincronizando los toggles de la UI.
   */
  cargarPreferenciasNotificaciones() {
    const guardadas = localStorage.getItem('prefs_notificaciones');
    if (guardadas) this.prefsNotificaciones = JSON.parse(guardadas);
  }

  /**
   * Muestra un toast de feedback con color de éxito (verde).
   * Usado para confirmar acciones importantes como guardar cambios o eliminar la cuenta.
   *
   * @param {string} msj - Mensaje a mostrar en el toast.
   * @returns {Promise<void>} Promesa que resuelve cuando el toast es presentado.
   */
  async mostrarAlertaExito(msj: string) {
    const toast = await this.toastController.create({
      message: msj, duration: 2000, color: 'success', position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Muestra un toast de advertencia indicando que una funcionalidad está en desarrollo.
   *
   * @param {string} modulo - Nombre del módulo o funcionalidad no disponible aún.
   * @returns {Promise<void>} Promesa que resuelve cuando el toast es presentado.
   */
  async mostrarEnConstruccion(modulo: string) {
    const toast = await this.toastController.create({
      message: `${modulo} estará listo pronto.`,
      duration: 2000, color: 'warning', position: 'bottom'
    });
    await toast.present();
  }
}