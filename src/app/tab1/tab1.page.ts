import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { 
  IonHeader, IonToolbar, IonContent, 
  IonFooter, IonRow, IonCol, IonInput, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send, alertCircle, hardwareChipOutline, shieldCheckmarkOutline } from 'ionicons/icons'; 

/**
 * @component Tab1Page
 * @description Pestaña de Chat con la IA "Guía SERENA".
 *
 * Es el núcleo de la aplicación: una interfaz de chat tipo WhatsApp donde el
 * estudiante puede conversar con un modelo de IA empático, entrenado para
 * brindar apoyo en salud mental en el contexto universitario colombiano.
 *
 * Funcionalidades clave:
 * - **Chat conversacional**: envía mensajes al backend FastAPI que los procesa
 *   con un LLM y retorna respuestas personalizadas.
 * - **Memoria contextual**: se envían los últimos 6 mensajes del historial local
 *   para dar continuidad a la conversación sin sesiones en el servidor.
 * - **Respuestas rápidas**: botones predefinidos para facilitar el inicio de la
 *   conversación a usuarios que no saben cómo expresarse.
 * - **Detección de crisis**: si el backend detecta señales de riesgo en el mensaje,
 *   activa `mostrarSOS = true` y muestra un panel de emergencias con el número 106.
 * - **Preferencias de tono**: lee `prefs_chat_serena` de `localStorage` para
 *   personalizar el tono y longitud de las respuestas de la IA.
 *
 * @selector app-tab1
 * @template tab1.page.html
 * @standalone true
 */
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, 
    IonHeader, IonToolbar, IonContent, 
    IonFooter, IonRow, IonCol, IonInput, IonButton, IonIcon
  ],
})
export class Tab1Page {
  /**
   * Referencia al contenedor scrollable del chat.
   * Se usa para invocar `scrollToBottom()` cada vez que llega un mensaje nuevo,
   * manteniendo la vista siempre en el último mensaje (comportamiento estándar de chat).
   */
  @ViewChild('chatContent', { static: false }) chatContent!: IonContent;

  /**
   * URL base del backend FastAPI.
   * @private
   */
  private apiUrl = 'https://backend-salud-t6br.onrender.com/api';
  
  /** Nombre del usuario autenticado, leído de `localStorage` al entrar a la pestaña. */
  nombreUsuario: string = 'Estudiante';
  /** Texto actual en el campo de entrada del chat. */
  nuevoMensaje: string = '';
  /** Indica si se está esperando respuesta del servidor (muestra indicador de "escribiendo..."). */
  cargando: boolean = false;
  /**
   * Controla la visibilidad del panel SOS de emergencias.
   * Se activa a `true` cuando el backend detecta una alerta de crisis en el mensaje
   * del usuario. Una vez visible, no se oculta automáticamente.
   */
  mostrarSOS: boolean = false; 
  
  /**
   * Historial de mensajes de la sesión actual.
   * Cada objeto tiene la forma `{ emisor: 'user' | 'bot', texto: string }`.
   * Se inicializa con el mensaje de bienvenida de Guía SERENA.
   */
  mensajes: any[] = [
    { emisor: 'bot', texto: '¡Hola! Soy Guía SERENA, tu apoyo en la UDEC. Estoy aquí para escucharte. ¿Cómo te sientes hoy?' }
  ];

  /**
   * Opciones de inicio rápido que aparecen como botones en la UI.
   * Permiten al usuario iniciar la conversación con un solo toque, reduciendo
   * la barrera de entrada para quienes no saben cómo empezar.
   */
  respuestasRapidas: string[] = [
    'Me siento estresado 😰', 
    'Tengo ansiedad 😟', 
    'No puedo dormir 🥱', 
    'Necesito hablar 🗣️'
  ];

  constructor(private http: HttpClient) {
    addIcons({ send, alertCircle, hardwareChipOutline, shieldCheckmarkOutline }); 
  }

  /**
   * Hook de ciclo de vida de Ionic. Se ejecuta cada vez que el usuario
   * navega hacia esta pestaña (incluso si ya estaba creada).
   * Se usa en lugar de `ngOnInit` porque `ngOnInit` solo se ejecuta una vez
   * en la vida del componente; con tabs Ionic, el componente persiste en memoria.
   */
  ionViewWillEnter() {
    this.nombreUsuario = localStorage.getItem('usuarioNombre') || 'Estudiante';
  }

  /**
   * Rellena el campo de entrada con el texto de una respuesta rápida
   * y lo envía inmediatamente sin necesidad de que el usuario presione enviar.
   *
   * @param {string} texto - Texto de la respuesta rápida seleccionada.
   */
  enviarRespuestaRapida(texto: string) {
    this.nuevoMensaje = texto;
    this.enviarMensaje();
  }

  /**
   * Envía el mensaje actual al backend y agrega la respuesta de la IA al chat.
   *
   * Flujo:
   * 1. Valida que el campo no esté vacío.
   * 2. Agrega el mensaje del usuario al array `mensajes`.
   * 3. Lee las preferencias de tono del chat desde `localStorage`.
   * 4. Limpia el input y activa el estado de carga.
   * 5. Hace scroll hacia el último mensaje.
   * 6. Envía POST a `/api/chat` con el mensaje, las preferencias y los últimos 6 mensajes
   *    del historial local para dar contexto a la IA sin necesidad de sesiones en el servidor.
   * 7. Al recibir respuesta, agrega el mensaje del bot al array.
   *    - Si `respuesta.alerta_crisis` es `true`, activa el panel de emergencias SOS.
   */
  enviarMensaje() {
    if (this.nuevoMensaje.trim() === '') return;

    const textoUsuario = this.nuevoMensaje;
    this.mensajes.push({ emisor: 'user', texto: textoUsuario });
    
    // Leemos las preferencias guardadas; si no existen, usamos valores por defecto
    const prefsRaw = localStorage.getItem('prefs_chat_serena');
    const prefs = prefsRaw ? JSON.parse(prefsRaw) : { tono: 'empatico', longitud: 'normal' };

    // Guardamos el mensaje en una variable y limpiamos el input
    this.nuevoMensaje = ''; 
    this.cargando = true;
    this.hacerScroll();

    const datosParaEnviar = {
      mensaje: textoUsuario,
      correo: localStorage.getItem('usuarioCorreo'),
      nombre: this.nombreUsuario,
      tono: prefs.tono,
      longitud: prefs.longitud,
      // Enviamos solo los últimos 6 mensajes para dar memoria reciente a la IA
      // sin sobrecargar el payload con conversaciones largas.
      historial: this.mensajes.slice(-6)
    };

    this.http.post<any>(`${this.apiUrl}/chat`, datosParaEnviar).subscribe({
      next: (respuesta) => {
        this.mensajes.push({ emisor: 'bot', texto: respuesta.respuesta_ia });
        // Si el backend detecta señales de crisis, mostramos el panel SOS de emergencias
        if (respuesta.alerta_crisis) this.mostrarSOS = true;
        this.cargando = false;
        this.hacerScroll();
      },
      error: (error) => {
        this.cargando = false;
        this.mensajes.push({ emisor: 'bot', texto: 'Perdí la señal, Jean.' });
      }
    });
  }

  /**
   * Abre el marcador telefónico nativo del dispositivo con el número de emergencias 106.
   * Usa `_system` como target para garantizar que Capacitor lo maneje como una llamada
   * real y no intente abrirlo en el WebView.
   */
  llamarEmergencia() {
    window.open('tel:106', '_system');
  }

  /**
   * Desplaza el contenedor del chat hasta el último mensaje.
   *
   * Se aplica un `setTimeout` de 100ms para que Angular tenga tiempo de renderizar
   * el nuevo mensaje en el DOM antes de calcular la posición de scroll.
   * Sin este retardo, `scrollToBottom` intentaría desplazarse antes de que el
   * elemento nuevo exista, resultando en un scroll incompleto.
   */
  hacerScroll() {
    setTimeout(() => {
      if(this.chatContent) {
        this.chatContent.scrollToBottom(300);
      }
    }, 100);
  }
}