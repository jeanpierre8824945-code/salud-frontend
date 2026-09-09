import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- NUEVO: Para peticiones al backend
import { addIcons } from 'ionicons';
import { chevronBackOutline, calendarOutline, timeOutline } from 'ionicons/icons';

/**
 * @component AgendaPage
 * @description Página de agendamiento de citas psicológicas de SERENA.
 *
 * Implementa un flujo de reserva de citas en tres pasos guiados:
 * 1. **Lista de especialistas**: el usuario elige entre los psicólogos disponibles.
 * 2. **Selección de fecha y hora**: se muestran los próximos 6 días hábiles. Al tocar
 *    una fecha, se consulta en tiempo real al backend qué horas ya están ocupadas para
 *    ese especialista y se filtran del listado base.
 * 3. **Confirmación**: se envía la cita al backend y se muestra feedback al usuario.
 *
 * Adicionalmente, al entrar a la pantalla se carga la lista de citas existentes del
 * usuario mediante el hook `ionViewWillEnter`, garantizando datos siempre frescos.
 *
 * La consulta dinámica de disponibilidad (paso 2) es la lógica más crítica: evita que
 * dos usuarios reserven el mismo horario simultáneamente, delegando la autoridad al backend.
 *
 * @selector app-agenda
 * @template agenda.page.html
 * @standalone true
 * @implements OnInit
 */
@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendaPage implements OnInit {
  
  /**
   * Controla cuál de las dos vistas principales se muestra:
   * - `'lista'`: panel de selección de especialista y lista de citas del usuario.
   * - `'calendario'`: panel de selección de fecha y hora para un especialista elegido.
   */
  vistaActual: 'lista' | 'calendario' = 'lista';

  /**
   * URL base del backend FastAPI.
   * @private
   */
  private apiUrl = 'https://backend-salud-t6br.onrender.com/api';

  /**
   * Catálogo de especialistas disponibles.
   * El campo `id` es la clave foránea usada en el backend para asociar citas.
   * Los datos de nombre y especialidad se usan únicamente para la presentación en UI.
   */
  especialistas = [
    { id: 'esp1', iniciales: 'AG', nombre: 'Dra. Ana García', especialidad: 'Ansiedad y Estrés Académico' },
    { id: 'esp2', iniciales: 'CM', nombre: 'Dr. Carlos Mendez', especialidad: 'Depresión y Bienestar Emocional' },
    { id: 'esp3', iniciales: 'MS', nombre: 'Dra. María Silva', especialidad: 'Relaciones y Autoestima' }
  ];

  /**
   * Horarios de atención base (plantilla completa del día laboral).
   * Este array nunca se modifica; sirve como fuente de verdad para generar
   * `horariosDisponibles` filtrando las horas ya ocupadas.
   */
  horariosBase = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  /**
   * Horarios disponibles para la fecha y especialista seleccionados.
   * Se calcula dinámicamente en `seleccionarFecha()` restando los horarios
   * ocupados (obtenidos del backend) al array `horariosBase`.
   */
  horariosDisponibles: string[] = [];

  /** Lista de citas ya agendadas por el usuario actual, cargada desde el backend. */
  misCitas: any[] = [];

  /**
   * Fechas disponibles para agendar (próximos 6 días hábiles, excluyendo domingos).
   * Cada objeto tiene la forma:
   * `{ diaTexto: string, diaNumero: number, formatoDB: string }`.
   * `formatoDB` es el valor `YYYY-MM-DD` enviado al backend.
   */
  fechas: any[] = [];

  /** Especialista actualmente seleccionado en el flujo de reserva. `null` si ninguno. */
  especialistaSeleccionado: any = null;
  /** Fecha actualmente seleccionada. Contiene el objeto completo de `fechas[]`. */
  fechaSeleccionada: any = null;
  /** Hora seleccionada como string (ej.: `'10:00'`). Vacío si ninguna elegida. */
  horaSeleccionada: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient // <-- NUEVO: Inyectado en el constructor
  ) {
    addIcons({ chevronBackOutline, calendarOutline, timeOutline });
  }

  /**
   * Hook del ciclo de vida Angular. Genera las fechas disponibles al crear el componente.
   * Se usa `ngOnInit` (no `ionViewWillEnter`) para esta lógica porque las fechas solo
   * necesitan calcularse una vez en la vida del componente.
   */
  ngOnInit() {
    this.generarFechasProximas();
  }

  /**
   * Hook de ciclo de vida de Ionic. Se ejecuta cada vez que se navega a esta página.
   * Recarga las citas del usuario para reflejar cancelaciones o confirmaciones recientes.
   */
  ionViewWillEnter() {
    // Esto se ejecuta cada vez que entras a la pestaña
    this.cargarMisCitas();
  }

  /**
   * Obtiene las citas del usuario actual desde el backend y las cruza con el catálogo
   * local de especialistas para enriquecer la información mostrada en la UI.
   *
   * @remarks
   * El backend almacena `especialista_id` (ej.: `'esp1'`), no el nombre. El cruce
   * se hace aquí en el cliente para mantener el backend desacoplado de los datos
   * de presentación y evitar joins innecesarios en el servidor.
   */
  cargarMisCitas() {
    const correo = localStorage.getItem('usuarioCorreo');
    if (!correo) return;

    this.http.get<any>(`${this.apiUrl}/mis-citas/${correo}`).subscribe({
      next: (respuesta) => {
        // Transformamos los datos para cruzar el ID del especialista con su nombre completo
        this.misCitas = respuesta.citas.map((cita: any) => {
          const doc = this.especialistas.find(e => e.id === cita.especialista_id);
          return {
            nombre_doctor: doc?.nombre || 'Especialista',
            especialidad: doc?.especialidad || '',
            fecha: cita.fecha,
            hora: cita.hora
          };
        });
      },
      error: (error) => console.error('Error al cargar mis citas:', error)
    });
  }

  /**
   * Selecciona un especialista e inicia el flujo de reserva cambiando a la vista de calendario.
   * Resetea la selección de fecha y hora para evitar que queden valores obsoletos de
   * una selección anterior.
   *
   * @param {any} esp - Objeto del especialista seleccionado del array `especialistas`.
   */
  seleccionarEspecialista(esp: any) {
    this.especialistaSeleccionado = esp;
    this.fechaSeleccionada = null; 
    this.horaSeleccionada = '';    
    this.horariosDisponibles = []; // Limpiamos horarios al cambiar de especialista
    this.vistaActual = 'calendario';
  }

  /**
   * Regresa a la vista de lista de especialistas y limpia el especialista seleccionado.
   */
  volverALista() {
    this.vistaActual = 'lista';
    this.especialistaSeleccionado = null;
  }

  /**
   * Selecciona una fecha y consulta en tiempo real la disponibilidad de horas al backend.
   *
   * Flujo:
   * 1. Asigna la fecha seleccionada y resetea la hora elegida.
   * 2. Muestra temporalmente todos los horarios base mientras la petición está en vuelo.
   * 3. Hace GET a `/api/citas-ocupadas` con el ID del especialista y la fecha en `YYYY-MM-DD`.
   * 4. Filtra `horariosBase` eliminando las horas ya reservadas, actualizando `horariosDisponibles`.
   *
   * @param {any} fecha - Objeto de fecha del array `fechas[]` con propiedades
   *   `diaTexto`, `diaNumero` y `formatoDB`.
   */
  seleccionarFecha(fecha: any) {
    this.fechaSeleccionada = fecha;
    this.horaSeleccionada = ''; 
    
    // Mostramos todos los horarios temporalmente mientras carga la disponibilidad real
    this.horariosDisponibles = [...this.horariosBase];

    // Consultamos al backend cuáles horas ya están reservadas para este especialista y fecha
    const url = `${this.apiUrl}/citas-ocupadas?especialista_id=${this.especialistaSeleccionado.id}&fecha=${fecha.formatoDB}`;
    
    this.http.get<any>(url).subscribe({
      next: (respuesta) => {
        const horasOcupadas = respuesta.horas_ocupadas;
        // Filtramos: Dejamos solo los horarios que NO estén en la lista de ocupados
        this.horariosDisponibles = this.horariosBase.filter(hora => !horasOcupadas.includes(hora));
      },
      error: (error) => console.error('Error al obtener disponibilidad:', error)
    });
  }

  /**
   * Registra la hora elegida por el usuario para la cita.
   *
   * @param {string} hora - Hora seleccionada en formato `HH:mm` (ej.: `'14:00'`).
   */
  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }

  /**
   * Confirma y envía la cita al backend vía POST `/api/agendar-cita`.
   *
   * Validaciones previas:
   * - Fecha y hora deben estar seleccionadas.
   * - El usuario debe tener sesión activa (correo en `localStorage`).
   *
   * En caso de éxito:
   * - Muestra confirmación y regresa a la lista tras 1.5 segundos (permite leer el mensaje).
   * - Recarga automáticamente la lista de citas.
   *
   * En caso de conflicto (la hora fue tomada por otro usuario):
   * - Muestra el mensaje de error del servidor.
   * - Recarga la disponibilidad de la fecha para que el usuario elija otra hora libre.
   *
   * @returns {Promise<void>}
   */
  async confirmarCita() {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      this.mostrarAlerta('Por favor selecciona una fecha y una hora.');
      return;
    }

    const correo = localStorage.getItem('usuarioCorreo');
    if (!correo) {
      this.mostrarAlerta('Error de sesión. Vuelve a iniciar sesión.');
      return;
    }

    const datosCita = {
      correo_estudiante: correo,
      especialista_id: this.especialistaSeleccionado.id,
      fecha: this.fechaSeleccionada.formatoDB,
      hora: this.horaSeleccionada
    };

    // Enviamos el POST a FastAPI
    this.http.post<any>(`${this.apiUrl}/agendar-cita`, datosCita).subscribe({
      next: (respuesta) => {
        if (respuesta.exito) {
          this.mostrarAlerta(`Cita agendada con ${this.especialistaSeleccionado.nombre} para las ${this.horaSeleccionada}.`, 'success');
          // Esperamos 1.5s para que el usuario lea el mensaje antes de navegar de regreso
          setTimeout(() => {
            this.volverALista();
            this.cargarMisCitas(); // Recargamos la lista automáticamente tras confirmar
          }, 1500);
        } else {
          this.mostrarAlerta(respuesta.mensaje, 'danger');
          // Recargamos la disponibilidad de la fecha porque otro usuario pudo tomar esa hora
          this.seleccionarFecha(this.fechaSeleccionada);
        }
      },
      error: (error) => {
        console.error('Error al agendar:', error);
        this.mostrarAlerta('Error conectando con el servidor.');
      }
    });
  }

  /**
   * Genera el array de fechas disponibles para los próximos 7 días (excluyendo domingos).
   *
   * @remarks
   * Los domingos se excluyen porque `getDay() === 0` en JavaScript representa el domingo.
   * Esto garantiza que solo se muestren días laborales en el selector de fechas.
   *
   * El formato `YYYY-MM-DD` se obtiene con `toISOString().split('T')[0]`.
   * Se usa ISO 8601 y no `toLocaleDateString` para evitar variaciones de formato
   * según la configuración regional del dispositivo del usuario.
   */
  generarFechasProximas() {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hoy = new Date();
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      // Excluimos los domingos (día 0 en JavaScript)
      if (fecha.getDay() !== 0) {
        // toISOString retorna 'YYYY-MM-DDTHH:mm:ssZ'; tomamos solo la parte de la fecha
        const formatoDB = fecha.toISOString().split('T')[0]; 
        
        this.fechas.push({
          diaTexto: diasSemana[fecha.getDay()],
          diaNumero: fecha.getDate(),
          formatoDB: formatoDB // Ej: "2026-09-08"
        });
      }
    }
  }

  /**
   * Muestra una notificación tipo toast en la parte inferior de la pantalla.
   *
   * @param {string} mensaje - Texto a mostrar en el toast.
   * @param {string} [color='warning'] - Color semántico del toast.
   *   Por defecto es `'warning'` para mensajes de validación.
   * @returns {Promise<void>} Promesa que resuelve cuando el toast es presentado.
   */
  async mostrarAlerta(mensaje: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}