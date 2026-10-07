// src/app/tabs/tabs.page.ts

import { Component, OnInit } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { grid, chatbubble, calendar, person } from 'ionicons/icons';

/**
 * @component TabsPage
 * @description Componente contenedor de la navegación principal por pestañas de SERENA.
 *
 * Actúa como el "shell" o esqueleto que envuelve las cuatro secciones principales
 * de la aplicación una vez que el usuario ha iniciado sesión:
 *
 * - **Inicio** (`/tabs/inicio`): Hub de bienestar y tests psicológicos (Tab2).
 * - **Chat** (`/tabs/chat`): Chat con la IA Guía SERENA (Tab1).
 * - **Agenda** (`/tabs/agenda`): Agendamiento de citas psicológicas.
 * - **Perfil** (`/tabs/perfil`): Configuración y perfil del usuario (Tab3).
 *
 * No contiene lógica de negocio propia. Su única responsabilidad es:
 * 1. Proveer el `<ion-tabs>` que gestiona el enrutamiento entre pestañas.
 * 2. Registrar los íconos de Ionicons usados en la barra de navegación inferior
 *    mediante `addIcons()`, necesario en el modo standalone de Ionic.
 *
 * @selector app-tabs
 * @template tabs.page.html
 * @standalone true
 */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage implements OnInit {

  /**
   * Constructor del componente.
   *
   * Registra de forma global los íconos de Ionicons necesarios para la barra
   * de navegación inferior. En el modo standalone de Angular + Ionic, los íconos
   * NO se cargan automáticamente; deben registrarse explícitamente con `addIcons()`
   * antes de que la plantilla intente renderizarlos.
   *
   * Íconos registrados:
   * - `grid`: ícono de la pestaña "Inicio".
   * - `chatbubble`: ícono de la pestaña "Chat".
   * - `calendar`: ícono de la pestaña "Agenda".
   * - `person`: ícono de la pestaña "Perfil".
   */
  constructor() {
    addIcons({ grid, chatbubble, calendar, person });
  }

  /**
   * Hook de ciclo de vida de Angular. Se ejecuta una sola vez al crear el componente.
   * En este componente está vacío porque no se necesita ninguna inicialización de datos;
   * la navegación la gestiona automáticamente el router de Ionic a través de `<ion-tabs>`.
   */
  ngOnInit() {
  }

}