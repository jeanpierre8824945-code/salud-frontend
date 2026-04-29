import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { 
  pulseOutline, heartOutline, medkitOutline, 
  chatbubbleEllipsesOutline, calendarOutline, bookOutline, 
  documentTextOutline, chevronBackOutline, chevronForwardOutline,
  checkmarkCircleOutline, alertCircleOutline, libraryOutline,
  videocamOutline, bulbOutline, openOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab2Page {
  
  // Datos de usuario
  usuario = { nombre: '...', sesiones: 0, diasActivos: 0, bienestar: '0%' };

  // Control de Tests
  mostrarTests: boolean = false;
  testActivo: boolean = false;
  resultadoFinal: any = null;
  testActivoId: string = '';
  preguntasActivas: string[] = [];
  preguntaActualIndex: number = 0;
  puntajeTotal: number = 0;

  // --- NUEVAS VARIABLES PARA RECURSOS ---
  modalRecursosAbierto: boolean = false;
  categoriaActual: string = 'todos';
  listaRecursos: any[] = [];
  recursosFiltrados: any[] = [];
  mostrarRecursos: boolean = false;

  private apiUrl = 'https://backend-salud-t6br.onrender.com/api';

  // Configuración de Tests
  encuestas = [
    { id: 'gad7', titulo: 'Test de Ansiedad (GAD-7)', descripcion: 'Evalúa tus niveles de ansiedad recientes.', icono: 'document-text-outline' },
    { id: 'phq9', titulo: 'Test de Depresión (PHQ-9)', descripcion: 'Mide tu estado de ánimo y energía.', icono: 'document-text-outline' },
    { id: 'estres', titulo: 'Test de Estrés Académico', descripcion: 'Enfocado en la carga universitaria.', icono: 'document-text-outline' }
  ];

  preguntasGAD7 = ["1. ¿Te has sentido nervioso/a, ansioso/a?", "2. ¿No has podido controlar la preocupación?", "3. ¿Te has preocupado demasiado?", "4. ¿Has tenido dificultad para relajarte?", "5. ¿Te has sentido tan inquieto/a que no has podido quedarte quieto/a?", "6. ¿Te has molestado o irritado fácilmente?", "7. ¿Has sentido miedo de que algo terrible pase?"];
  preguntasPHQ9 = ["1. ¿Poco interés o placer en hacer las cosas?", "2. ¿Te has sentido desanimado/a o deprimido/a?", "3. ¿Problemas para dormir o dormir demasiado?", "4. ¿Poca energía?", "5. ¿Poco apetito o comer en exceso?", "6. ¿Sentir que has decepcionado a otros?", "7. ¿Dificultad para concentrarte?", "8. ¿Moverte o hablar muy lentamente/rápido?", "9. ¿Pensamientos de lastimarte?"];
  preguntasEstres = ["1. ¿Sientes que la sobrecarga de la universidad te supera?", "2. ¿Te falta tiempo para tus compromisos?", "3. ¿Sientes presión por mantener un buen promedio?", "4. ¿Angustia al pensar en tu futuro profesional?", "5. ¿Tensión por el ambiente de la universidad?"];

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
      libraryOutline, videocamOutline, bulbOutline, openOutline 
    });
  }

  ionViewWillEnter() {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    this.usuario.nombre = localStorage.getItem('usuarioNombre') || 'Estudiante';
    this.usuario.sesiones = parseInt(localStorage.getItem('usuarioSesiones') || '0');
    this.usuario.diasActivos = parseInt(localStorage.getItem('usuarioDias') || '1');
    this.usuario.bienestar = localStorage.getItem('usuarioBienestar') || '100%';
  }

  // Navegación
  irAChat() { this.router.navigate(['/tabs/chat']); }
  irAAgenda() { this.router.navigate(['/tabs/agenda']); }
  
  // --- LÓGICA DE RECURSOS ---
  abrirRecursos() {
    this.cargarRecursosDesdeServidor();
    this.mostrarRecursos = true; // Cambiamos el estado para mostrar la "pantalla" de recursos
  }

  volverAInicioDesdeRecursos() {
    this.mostrarRecursos = false;
  }
  cerrarRecursos() {
    this.modalRecursosAbierto = false;
  }

  cargarRecursosDesdeServidor() {
    this.http.get<any[]>(`${this.apiUrl}/recursos`).subscribe({
      next: (res) => {
        this.listaRecursos = res;
        this.filtrarCategoria('todos');
      },
      error: (err) => console.error('Error al traer recursos:', err)
    });
  }

  filtrarCategoria(cat: string) {
    this.categoriaActual = cat;
    if (cat === 'todos') {
      this.recursosFiltrados = this.listaRecursos;
    } else {
      this.recursosFiltrados = this.listaRecursos.filter(r => r.categoria === cat);
    }
  }

  abrirEnlace(url: string) {
    if (url) {
      window.open(url, '_system');
    }
  }

  // --- LÓGICA DE TESTS (Mantenida) ---
  abrirMenuTests() { this.mostrarTests = true; }
  volverInicio() { this.mostrarTests = false; }

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

  seleccionarRespuesta(puntos: number) {
    this.puntajeTotal += puntos;
    if (this.preguntaActualIndex < this.preguntasActivas.length - 1) {
      this.preguntaActualIndex++;
    } else {
      this.calcularResultado();
    }
  }

  calcularResultado() {
    this.testActivo = false;
    let diagnostico = ''; let mensaje = ''; let color = ''; 
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
          localStorage.setItem('usuarioSesiones', respuesta.nuevas_metricas.sesiones.toString());
          localStorage.setItem('usuarioBienestar', respuesta.nuevas_metricas.bienestar);
          this.usuario.sesiones = respuesta.nuevas_metricas.sesiones;
          this.usuario.bienestar = respuesta.nuevas_metricas.bienestar;
        }
      },
      error: (error) => console.error('Error guardando el test:', error)
    });
  }

  cerrarTest() {
    this.resultadoFinal = null;
    this.mostrarTests = false;
  }

  obtenerTituloTest() { return this.encuestas.find(e => e.id === this.testActivoId)?.titulo || 'Evaluación'; }
}