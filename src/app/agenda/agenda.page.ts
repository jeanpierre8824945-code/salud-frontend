import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <-- NUEVO: Para peticiones al backend
import { addIcons } from 'ionicons';
import { chevronBackOutline, calendarOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendaPage implements OnInit {
  
  vistaActual: 'lista' | 'calendario' = 'lista';
  private apiUrl = 'https://backend-salud-t6br.onrender.com/api'; // <-- NUEVO: Ruta de tu burbuja local

  especialistas = [
    { id: 'esp1', iniciales: 'AG', nombre: 'Dra. Ana García', especialidad: 'Ansiedad y Estrés Académico' },
    { id: 'esp2', iniciales: 'CM', nombre: 'Dr. Carlos Mendez', especialidad: 'Depresión y Bienestar Emocional' },
    { id: 'esp3', iniciales: 'MS', nombre: 'Dra. María Silva', especialidad: 'Relaciones y Autoestima' }
  ];

  horariosBase = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  horariosDisponibles: string[] = []; // <-- NUEVO: Ahora esto será dinámico
  misCitas: any[] = [];
  fechas: any[] = [];

  especialistaSeleccionado: any = null;
  fechaSeleccionada: any = null;
  horaSeleccionada: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private http: HttpClient // <-- NUEVO: Inyectado en el constructor
  ) {
    addIcons({ chevronBackOutline, calendarOutline, timeOutline });
  }

  ngOnInit() {
    this.generarFechasProximas();
  }


ionViewWillEnter() {
    // Esto se ejecuta cada vez que entras a la pestaña
    this.cargarMisCitas();
  }

  cargarMisCitas() {
    const correo = localStorage.getItem('usuarioCorreo');
    if (!correo) return;

    this.http.get<any>(`${this.apiUrl}/mis-citas/${correo}`).subscribe({
      next: (respuesta) => {
        // Transformamos los datos para cruzar el ID con el nombre del doctor
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



  seleccionarEspecialista(esp: any) {
    this.especialistaSeleccionado = esp;
    this.fechaSeleccionada = null; 
    this.horaSeleccionada = '';    
    this.horariosDisponibles = []; // Limpiamos horarios
    this.vistaActual = 'calendario';
  }

  volverALista() {
    this.vistaActual = 'lista';
    this.especialistaSeleccionado = null;
  }

  // <-- NUEVO: Ahora al tocar una fecha, le pregunta al backend qué horas están libres
  seleccionarFecha(fecha: any) {
    this.fechaSeleccionada = fecha;
    this.horaSeleccionada = ''; 
    
    // Mostramos todos los horarios temporalmente mientras carga
    this.horariosDisponibles = [...this.horariosBase];

    // Consultamos al backend las horas ocupadas
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

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }

  // <-- NUEVO: Guardar en base de datos real
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
          setTimeout(() => {
            this.volverALista();
            this.cargarMisCitas(); // <-- Magia: Recargamos la lista automáticamente
          }, 1500);
        } else {
          this.mostrarAlerta(respuesta.mensaje, 'danger');
          // Recargamos la fecha para borrar la hora que alguien más tomó
          this.seleccionarFecha(this.fechaSeleccionada);
        }
      },
      error: (error) => {
        console.error('Error al agendar:', error);
        this.mostrarAlerta('Error conectando con el servidor.');
      }
    });
  }

  generarFechasProximas() {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hoy = new Date();
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      if (fecha.getDay() !== 0) {
        // <-- NUEVO: Formateamos la fecha a YYYY-MM-DD para la Base de Datos
        const formatoDB = fecha.toISOString().split('T')[0]; 
        
        this.fechas.push({
          diaTexto: diasSemana[fecha.getDay()],
          diaNumero: fecha.getDate(),
          formatoDB: formatoDB // Ej: "2026-04-28"
        });
      }
    }
  }

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