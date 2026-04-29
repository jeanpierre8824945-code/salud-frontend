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
  @ViewChild('chatContent', { static: false }) chatContent!: IonContent;

  // <-- APUNTAMOS AL SERVIDOR LOCAL (La Burbuja)
  private apiUrl = 'https://backend-salud-t6br.onrender.com/api';
  
  nombreUsuario: string = 'Estudiante';
  nuevoMensaje: string = '';
  cargando: boolean = false;
  mostrarSOS: boolean = false; 
  
  mensajes: any[] = [
    { emisor: 'bot', texto: '¡Hola! Soy Guía SERENA, tu apoyo en la UDEC. Estoy aquí para escucharte. ¿Cómo te sientes hoy?' }
  ];

  respuestasRapidas: string[] = [
    'Me siento estresado 😰', 
    'Tengo ansiedad 😟', 
    'No puedo dormir 🥱', 
    'Necesito hablar 🗣️'
  ];

  constructor(private http: HttpClient) {
    addIcons({ send, alertCircle, hardwareChipOutline, shieldCheckmarkOutline }); 
  }

  // <-- LEEMOS TU NOMBRE REAL AL ENTRAR A LA PESTAÑA
  ionViewWillEnter() {
    this.nombreUsuario = localStorage.getItem('usuarioNombre') || 'Estudiante';
  }

  enviarRespuestaRapida(texto: string) {
    this.nuevoMensaje = texto;
    this.enviarMensaje();
  }

enviarMensaje() {
  if (this.nuevoMensaje.trim() === '') return;

  const textoUsuario = this.nuevoMensaje;
  this.mensajes.push({ emisor: 'user', texto: textoUsuario });
  
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
    historial: this.mensajes.slice(-6) // <-- ENVIAMOS LOS ÚLTIMOS 6 MENSAJES PARA TENER MEMORIA
  };

  this.http.post<any>(`${this.apiUrl}/chat`, datosParaEnviar).subscribe({
    next: (respuesta) => {
      this.mensajes.push({ emisor: 'bot', texto: respuesta.respuesta_ia });
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

  llamarEmergencia() {
    window.open('tel:106', '_system');
  }

  hacerScroll() {
    setTimeout(() => {
      if(this.chatContent) {
        this.chatContent.scrollToBottom(300);
      }
    }, 100);
  }
}