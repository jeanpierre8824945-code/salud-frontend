import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { addIcons } from 'ionicons';
import { 
  pulseOutline, heartOutline, medkitOutline, 
  chatbubbleEllipsesOutline, calendarOutline, bookOutline, 
  documentTextOutline, chevronBackOutline, chevronForwardOutline,
  checkmarkCircleOutline, alertCircleOutline, libraryOutline,
  videocamOutline, bulbOutline, openOutline, gameControllerOutline
} from 'ionicons/icons';

/**
 * @component Tab2Page
 * @description Pestaña de Bienestar y Recursos — el "hub" de salud mental de SERENA.
 *
 * Centraliza tres módulos principales:
 *
 * 1. **Panel de métricas**: muestra el nombre, número de sesiones, días activos y
 *    nivel de bienestar del usuario, leídos de `localStorage` (persistidos en el login
 *    y actualizados tras cada test completado).
 *
 * 2. **Tests psicológicos estandarizados**:
 *    - **GAD-7** (Generalized Anxiety Disorder): 7 preguntas, escala 0-21.
 *    - **PHQ-9** (Patient Health Questionnaire): 9 preguntas, escala 0-27.
 *    - **Estrés Académico**: 5 preguntas adaptadas al contexto universitario.
 *    Al finalizar, calcula un diagnóstico, lo muestra en pantalla y lo persiste
 *    en el backend para actualizar las métricas del usuario.
 *
 * 3. **Biblioteca de recursos**: carga desde el servidor una lista de artículos,
 *    videos y guías de salud mental. Permite filtrar por categoría.
 *
 * @selector app-tab2
 * @template tab2.page.html
 * @standalone true
 */
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab2Page {
  
  // Datos de usuario
  /** Datos del usuario activo, cargados desde `localStorage` en `ionViewWillEnter`. */
  usuario = { nombre: '...', sesiones: 0, diasActivos: 0, bienestar: '0%' };

  // Control de Tests
  // --- Estado de la UI para el módulo de Tests ---
  /** Controla si se muestra el menú de selección de tests. */
  mostrarTests: boolean = false;
  /** `true` mientras el usuario está respondiendo las preguntas de un test activo. */
  testActivo: boolean = false;
  /**
   * Objeto con el resultado calculado del test.
   * Estructura: `{ puntaje, maximo, diagnostico, mensaje, color }`.
   * `null` si no hay test completado.
   */
  resultadoFinal: any = null;
  /** ID del test actualmente en curso: `'gad7'`, `'phq9'` o `'estres'`. */
  testActivoId: string = '';
  /** Array de preguntas del test activo, asignado en `iniciarTest()`. */
  preguntasActivas: string[] = [];
  /** Índice de la pregunta actualmente visible (basado en 0). */
  preguntaActualIndex: number = 0;
  /** Acumulador de puntaje durante la ejecución del test. */
  puntajeTotal: number = 0;

  // --- NUEVAS VARIABLES PARA RECURSOS ---
  // --- Estado de la UI para el módulo de Recursos ---
  /** Controla si el modal de recursos está abierto (uso legacy, ver `mostrarRecursos`). */
  modalRecursosAbierto: boolean = false;
  /** Categoría seleccionada actualmente en el filtro de recursos (`'todos'` por defecto). */
  categoriaActual: string = 'todos';
  /** Lista completa de recursos recibida del servidor. */
  listaRecursos: any[] = [];
  /** Subconjunto de `listaRecursos` filtrado por `categoriaActual`. */
  recursosFiltrados: any[] = [];
  /** Controla si se muestra la "pantalla" (vista) de recursos en lugar del inicio. */
  mostrarRecursos: boolean = false;

  /**
   * URL base del backend FastAPI.
   * @private
   */
  private apiUrl = environment.apiUrl;

  // Configuración de Tests
  /**
   * Metadatos de los tests disponibles para mostrar en el menú de selección.
   * El `id` es la clave que enlaza con los arrays de preguntas correspondientes.
   */
  encuestas = [
    { id: 'gad7', titulo: 'Test de Ansiedad (GAD-7)', descripcion: 'Evalúa tus niveles de ansiedad recientes.', icono: 'document-text-outline' },
    { id: 'phq9', titulo: 'Test de Depresión (PHQ-9)', descripcion: 'Mide tu estado de ánimo y energía.', icono: 'document-text-outline' },
    { id: 'estres', titulo: 'Test de Estrés Académico', descripcion: 'Enfocado en la carga universitaria.', icono: 'document-text-outline' }
  ];

  /** Preguntas del test GAD-7 (Escala de Trastorno de Ansiedad Generalizada de 7 ítems). */
  preguntasGAD7 = ["1. ¿Te has sentido nervioso/a, ansioso/a?", "2. ¿No has podido controlar la preocupación?", "3. ¿Te has preocupado demasiado?", "4. ¿Has tenido dificultad para relajarte?", "5. ¿Te has sentido tan inquieto/a que no has podido quedarte quieto/a?", "6. ¿Te has molestado o irritado fácilmente?", "7. ¿Has sentido miedo de que algo terrible pase?"];
  /** Preguntas del test PHQ-9 (Cuestionario de Salud del Paciente de 9 ítems). */
  preguntasPHQ9 = ["1. ¿Poco interés o placer en hacer las cosas?", "2. ¿Te has sentido desanimado/a o deprimido/a?", "3. ¿Problemas para dormir o dormir demasiado?", "4. ¿Poca energía?", "5. ¿Poco apetito o comer en exceso?", "6. ¿Sentir que has decepcionado a otros?", "7. ¿Dificultad para concentrarte?", "8. ¿Moverte o hablar muy lentamente/rápido?", "9. ¿Pensamientos de lastimarte?"];
  /** Preguntas del Test de Estrés Académico, adaptadas al contexto universitario colombiano. */
  preguntasEstres = ["1. ¿Sientes que la sobrecarga de la universidad te supera?", "2. ¿Te falta tiempo para tus compromisos?", "3. ¿Sientes presión por mantener un buen promedio?", "4. ¿Angustia al pensar en tu futuro profesional?", "5. ¿Tensión por el ambiente de la universidad?"];

  /**
   * Opciones de respuesta compartidas por todos los tests (escala tipo Likert).
   * El campo `valor` es el puntaje que se acumula en `puntajeTotal` al seleccionar esa opción.
   */
  opcionesRespuesta = [
    { texto: 'Nunca', valor: 0 },
    { texto: 'Varios días', valor: 1 },
    { texto: 'Más de la mitad de los días', valor: 2 },
    { texto: 'Casi todos los días', valor: 3 }
  ];

  constructor(private router: Router, private http: HttpClient) {
    addIcons({ 
      pulseOutline, heartOutline, medkitOutline, chatbubbleEllipsesOutline, 
      calendarOutline, bookOutline, documentTextOutline, chevronBackOutline, 
      chevronForwardOutline, checkmarkCircleOutline, alertCircleOutline,
      libraryOutline, videocamOutline, bulbOutline, openOutline,
      gameControllerOutline
    });
  }

  /**
   * Hook de ciclo de vida de Ionic. Se ejecuta al entrar a la pestaña.
   * Recarga los datos del usuario desde `localStorage` para reflejar
   * cambios (ej.: métricas actualizadas tras completar un test en esta misma sesión).
   */
  ionViewWillEnter() {
    this.cargarDatosUsuario();
  }

  /**
   * Lee y asigna los datos del usuario persistidos en `localStorage`.
   * Estos datos son escritos por `LoginPage.ingresar()` y actualizados por
   * `guardarTestEnBackend()` tras cada test completado.
   */
  cargarDatosUsuario() {
    this.usuario.nombre = localStorage.getItem('usuarioNombre') || 'Estudiante';
    this.usuario.sesiones = parseInt(localStorage.getItem('usuarioSesiones') || '0');
    this.usuario.diasActivos = parseInt(localStorage.getItem('usuarioDias') || '1');
    this.usuario.bienestar = localStorage.getItem('usuarioBienestar') || '100%';
  }

  // Navegación
  // --- Navegación hacia otras pestañas ---
  /** Navega programáticamente a la pestaña de Chat (Tab1). */
  irAChat() { this.router.navigate(['/tabs/chat']); }
  /** Navega programáticamente a la página de Agenda de citas. */
  irAAgenda() { this.router.navigate(['/tabs/agenda']); }
  
  // --- LÓGICA DE RECURSOS ---
  // --- Módulo de Recursos ---

  /**
   * Inicia la carga de recursos desde el servidor y activa la vista de recursos.
   * Usa una transición de estado en lugar de un modal para mayor fluidez en móvil.
   */
  abrirRecursos() {
    this.cargarRecursosDesdeServidor();
    this.mostrarRecursos = true; // Cambiamos el estado para mostrar la "pantalla" de recursos
  }

  /** Regresa a la vista principal desde la sección de recursos. */
  volverAInicioDesdeRecursos() {
    this.mostrarRecursos = false;
  }
  /** Cierra el modal de recursos (manejo del estado legacy `modalRecursosAbierto`). */
  cerrarRecursos() {
    this.modalRecursosAbierto = false;
  }

  /**
   * Biblioteca local de recursos curados para estudiantes universitarios.
   * Cubre las 4 categorías del filtro: juego, video, lectura, tip.
   * Se fusiona con los datos del servidor en `cargarRecursosDesdeServidor()`,
   * garantizando contenido siempre visible aunque el backend no responda.
   */
  public recursosLocales: any[] = [
    // --- Juegos e interactivos ---
    { id: 101, titulo: 'Respiración Visual Interactiva', descripcion: 'Sincroniza tu respiración para calmar la ansiedad.', categoria: 'juego', enlace: 'https://xhalr.com/', icono: 'game-controller-outline' },
    { id: 102, titulo: 'Arte Relajante Zen', descripcion: 'Dibuja patrones de luz para despejar tu mente.', categoria: 'juego', enlace: 'http://weavesilk.com/', icono: 'game-controller-outline' },
    { id: 103, titulo: 'A Soft Murmur (Sonidos)', descripcion: 'Mezclador interactivo de lluvia, viento y olas para concentrarte.', categoria: 'juego', enlace: 'https://asoftmurmur.com/', icono: 'game-controller-outline' },
    { id: 109, titulo: 'Quick, Draw!', descripcion: 'Distrae tu mente 5 minutos dibujando con inteligencia artificial.', categoria: 'juego', enlace: 'https://quickdraw.withgoogle.com/', icono: 'game-controller-outline' },

    // --- Videos ---
    { id: 104, titulo: 'Yoga para relajar cuello y espalda', descripcion: 'Rutina de 10 min para liberar tensión después de estudiar.', categoria: 'video', enlace: 'https://www.youtube.com/watch?v=b1H3xO3x_Js', icono: 'videocam-outline' },
    { id: 105, titulo: 'Radio Lofi para Estudiar', descripcion: 'Beats relajantes 24/7 para máxima concentración.', categoria: 'video', enlace: 'https://www.youtube.com/watch?v=lTRiuFIWV54', icono: 'videocam-outline' },

    // --- Lecturas ---
    { id: 106, titulo: 'Higiene del Sueño', descripcion: 'Consejos clínicos para dormir mejor en época de parciales.', categoria: 'lectura', enlace: 'https://www.mayoclinic.org/es-es/healthy-lifestyle/adult-health/in-depth/sleep/art-20048379', icono: 'book-outline' },
    { id: 107, titulo: 'La regla de los 2 Minutos', descripcion: 'Un método rápido para vencer la procrastinación.', categoria: 'lectura', enlace: 'https://lamenteesmaravillosa.com/la-regla-de-los-dos-minutos-para-dejar-de-procrastinar/', icono: 'book-outline' },

    // --- Tips y herramientas ---
    { id: 108, titulo: 'Matriz de Eisenhower', descripcion: 'Aprende a priorizar tareas entre lo urgente y lo importante.', categoria: 'tip', enlace: 'https://todoist.com/es/productivity-methods/eisenhower-matrix', icono: 'bulb-outline' }
  ];

  /**
   * Diccionario de curación: mapea el título exacto de un recurso a su URL correcta.
   * Se usa en `cargarRecursosDesdeServidor()` cuando el backend devuelve un enlace vacío,
   * garantizando que recursos conocidos siempre abran su contenido apropiado.
   */
  private readonly enlacesCurados: Record<string, string> = {
    "Meditación 5 Minutos":       'https://www.youtube.com/watch?v=cZJjJEWixvE',
    "El poder del 'Todavía'":     'https://www.ted.com/talks/carol_dweck_the_power_of_believing_that_you_can_improve?language=es',
    "Técnica Pomodoro":           'https://pomodoro-tracker.com/?lang=es'
  };

  /**
   * URLs genéricas de respaldo por categoría.
   * Se usan cuando un recurso del backend no tiene enlace Y no está en `enlacesCurados`.
   */
  private readonly RESPALDO_POR_CATEGORIA: Record<string, string> = {
    video:   'https://www.youtube.com/watch?v=cZJjJEWixvE',
    lectura: 'https://www.psicologia-online.com/',
    tip:     'https://pomodoro-tracker.com/?lang=es',
    juego:   'https://xhalr.com/'
  };

  /**
   * Solicita la lista de recursos al endpoint GET `/api/recursos`, aplica curación
   * inteligente de URLs (diccionario → respaldo por categoría), la combina con los
   * recursos de juego locales y aplica el filtro inicial `'todos'`.
   */
  cargarRecursosDesdeServidor() {
    this.http.get<any[]>(`${this.apiUrl}/recursos`).subscribe({
      next: (res) => {
        const recursosSanitizados = res.map(r => {
          // 1. Si el recurso ya trae un enlace válido, lo respetamos
          if (r.enlace && r.enlace.trim() !== '') return r;

          // 2. Si no tiene enlace, buscamos en el diccionario de curación por título exacto
          const urlCurada = this.enlacesCurados[r.titulo as string];
          if (urlCurada) return { ...r, enlace: urlCurada };

          // 3. Último recurso: URL genérica según la categoría del recurso
          const urlCategoria = this.RESPALDO_POR_CATEGORIA[r.categoria as string]
            ?? 'https://www.youtube.com/watch?v=cZJjJEWixvE';
          return { ...r, enlace: urlCategoria };
        });

        // Fusionamos: recursos del servidor primero, luego los locales curados
        this.listaRecursos = [...recursosSanitizados, ...this.recursosLocales];
        this.filtrarCategoria('todos');
      },
      error: (err) => {
        // Si falla el servidor, la biblioteca local sigue siendo funcional
        console.error('Error al traer recursos:', err);
        this.listaRecursos = [...this.recursosLocales];
        this.filtrarCategoria('todos');
      }
    });
  }

  /**
   * Filtra la lista de recursos por categoría y actualiza `recursosFiltrados`.
   * El caso especial `'todos'` muestra la lista completa sin filtrar.
   *
   * @param {string} cat - Categoría a filtrar (ej.: `'video'`, `'lectura'`, `'tip'`, `'juego'`, `'todos'`).
   */
  filtrarCategoria(cat: string) {
    this.categoriaActual = cat;
    if (cat === 'todos') {
      this.recursosFiltrados = this.listaRecursos;
    } else {
      this.recursosFiltrados = this.listaRecursos.filter(r => r.categoria === cat);
    }
  }

  /**
   * Abre una URL de recurso en el navegador externo del sistema.
   *
   * Lógica de sanitización:
   * 1. Si `url` es nula o vacía → no hace nada (return temprano).
   * 2. Si `url` no empieza con `http://` ni `https://` → prepende `https://`
   *    para evitar que el navegador la trate como ruta relativa.
   * 3. Abre en pestaña nueva con `'_blank'` (compatible con web/PWA y Capacitor).
   *
   * @param {string} url - URL del recurso a abrir.
   */
  abrirRecurso(url: string) {
    if (!url || url.trim() === '') return;

    const urlNormalizada =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;

    window.open(urlNormalizada, '_blank');
  }

  /**
   * @deprecated Usa `abrirRecurso()`. Mantenido por compatibilidad con llamadas legacy.
   */
  abrirEnlace(url: string) {
    this.abrirRecurso(url);
  }

  // --- LÓGICA DE TESTS (Mantenida) ---
  // --- Módulo de Tests ---

  /** Muestra el menú de selección de tests. */
  abrirMenuTests() { this.mostrarTests = true; }
  /** Regresa a la vista principal ocultando el menú de tests. */
  volverInicio() { this.mostrarTests = false; }

  /**
   * Inicializa y arranca un test psicológico.
   * Resetea todos los contadores y asigna las preguntas correspondientes al ID recibido.
   *
   * @param {string} idTest - Identificador del test: `'gad7'`, `'phq9'` o `'estres'`.
   */
  iniciarTest(idTest: string) {
    this.testActivoId = idTest;
    this.preguntaActualIndex = 0;
    this.puntajeTotal = 0;
    this.resultadoFinal = null;
    if (idTest === 'gad7') this.preguntasActivas = this.preguntasGAD7;
    else if (idTest === 'phq9') this.preguntasActivas = this.preguntasPHQ9;
    else if (idTest === 'estres') this.preguntasActivas = this.preguntasEstres;
    this.testActivo = true;
  }

  /**
   * Registra la respuesta del usuario a la pregunta actual y avanza al siguiente paso.
   * Si ya se respondió la última pregunta, llama a `calcularResultado()`.
   *
   * @param {number} puntos - Valor numérico de la opción seleccionada (0, 1, 2 o 3).
   */
  seleccionarRespuesta(puntos: number) {
    this.puntajeTotal += puntos;
    if (this.preguntaActualIndex < this.preguntasActivas.length - 1) {
      this.preguntaActualIndex++;
    } else {
      this.calcularResultado();
    }
  }

  /**
   * Calcula el diagnóstico basándose en el puntaje total acumulado y los umbrales
   * clínicos oficiales de cada instrumento.
   *
   * Umbrales aplicados:
   * - **GAD-7**: Mínima ≤4 | Leve ≤9 | Moderada ≤14 | Severa >14
   * - **PHQ-9**: Mínima ≤4 | Leve ≤9 | Moderada ≤14 | Severa >14
   * - **Estrés**: Bajo ≤5 | Medio ≤10 | Alto >10
   *
   * Asigna el resultado a `resultadoFinal` y lo persiste en el backend
   * invocando `guardarTestEnBackend()`.
   */
  calcularResultado() {
    this.testActivo = false;
    let diagnostico = ''; let mensaje = ''; let color = ''; 
    // El puntaje máximo teórico es: número de preguntas × 3 (valor máximo por opción)
    let puntajeMaximo = this.preguntasActivas.length * 3;

    if (this.testActivoId === 'gad7') {
      if (this.puntajeTotal <= 4) { diagnostico = 'Ansiedad Mínima'; color = 'success'; mensaje = 'Tus niveles están bien.'; }
      else if (this.puntajeTotal <= 9) { diagnostico = 'Ansiedad Leve'; color = 'warning'; mensaje = 'Tienes síntomas leves.'; }
      else if (this.puntajeTotal <= 14) { diagnostico = 'Ansiedad Moderada'; color = 'danger'; mensaje = 'Tu ansiedad es moderada.'; }
      else { diagnostico = 'Ansiedad Severa'; color = 'danger'; mensaje = 'Niveles altos detectados.'; }
    } 
    else if (this.testActivoId === 'phq9') {
      if (this.puntajeTotal <= 4) { diagnostico = 'Depresión Mínima'; color = 'success'; mensaje = 'Estado de ánimo estable.'; }
      else if (this.puntajeTotal <= 9) { diagnostico = 'Depresión Leve'; color = 'warning'; mensaje = 'Algunos síntomas detectados.'; }
      else if (this.puntajeTotal <= 14) { diagnostico = 'Depresión Moderada'; color = 'danger'; mensaje = 'Decaimiento moderado.'; }
      else { diagnostico = 'Depresión Severa'; color = 'danger'; mensaje = 'Síntomas críticos detectados.'; }
    }
    else if (this.testActivoId === 'estres') {
      if (this.puntajeTotal <= 5) { diagnostico = 'Estrés Bajo'; color = 'success'; mensaje = 'Buena gestión académica.'; }
      else if (this.puntajeTotal <= 10) { diagnostico = 'Estrés Medio'; color = 'warning'; mensaje = 'Carga académica elevada.'; }
      else { diagnostico = 'Estrés Alto'; color = 'danger'; mensaje = 'Sobrecarga detectada.'; }
    }

    this.resultadoFinal = { puntaje: this.puntajeTotal, maximo: puntajeMaximo, diagnostico, mensaje, color };
    this.guardarTestEnBackend();
  }

  /**
   * Envía el resultado del test completado al backend vía POST `/api/guardar-test`.
   *
   * Tras una respuesta exitosa, sincroniza las métricas actualizadas del usuario
   * (sesiones y bienestar) tanto en `localStorage` como en la propiedad `usuario`
   * para que la UI refleje el cambio sin necesidad de recargar.
   *
   * @remarks
   * Si el usuario no tiene sesión activa (correo no en localStorage), el método
   * retorna silenciosamente sin enviar nada al servidor.
   */
  guardarTestEnBackend() {
    const correo = localStorage.getItem('usuarioCorreo');
    if (!correo) return;

    const datosTest = {
      correo: correo,
      puntaje: this.puntajeTotal,
      test_id: this.testActivoId
    };

    this.http.post<any>(`${this.apiUrl}/guardar-test`, datosTest).subscribe({
      next: (respuesta) => {
        if (respuesta.exito) {
          // Actualizamos localStorage y el objeto local para que la UI refleje
          // las nuevas métricas sin necesidad de navegar a otra pantalla.
          localStorage.setItem('usuarioSesiones', respuesta.nuevas_metricas.sesiones.toString());
          localStorage.setItem('usuarioBienestar', respuesta.nuevas_metricas.bienestar);
          this.usuario.sesiones = respuesta.nuevas_metricas.sesiones;
          this.usuario.bienestar = respuesta.nuevas_metricas.bienestar;
        }
      },
      error: (error) => console.error('Error guardando el test:', error)
    });
  }

  /**
   * Cierra la pantalla de resultados y regresa al inicio principal.
   * Resetea `resultadoFinal` para limpiar el estado antes de una posible
   * nueva ejecución de test.
   */
  cerrarTest() {
    this.resultadoFinal = null;
    this.mostrarTests = false;
  }

  /**
   * Retorna el título legible del test activo buscando en el array `encuestas`.
   * Devuelve `'Evaluación'` como valor por defecto si no se encuentra el ID.
   *
   * @returns {string} Título del test activo.
   */
  obtenerTituloTest() { return this.encuestas.find(e => e.id === this.testActivoId)?.titulo || 'Evaluación'; }
}