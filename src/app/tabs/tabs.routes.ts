// src/app/tabs/tabs.routes.ts

/**
 * @file tabs.routes.ts
 * @description Definición de las rutas hijas del contenedor de pestañas de SERENA.
 *
 * Estas rutas son cargadas de forma diferida (lazy) desde `app.routes.ts` mediante
 * `loadChildren`. Cada ruta hija corresponde a una de las cuatro pestañas principales
 * de la aplicación.
 *
 * Árbol de rutas dentro de `/tabs`:
 * ```
 * /tabs/inicio   → Tab2Page  (Hub de bienestar y tests psicológicos)
 * /tabs/chat     → Tab1Page  (Chat con la IA Guía SERENA)
 * /tabs/agenda   → AgendaPage (Agendamiento de citas psicológicas)
 * /tabs/perfil   → Tab3Page  (Perfil y configuración del usuario)
 * /tabs          → redirige a /tabs/inicio (pestaña por defecto al entrar a la app)
 * ```
 *
 * Todos los componentes se cargan con `loadComponent` (lazy loading por componente),
 * lo que asegura que Angular solo descargue el código de una pestaña cuando el
 * usuario la visita por primera vez, optimizando el rendimiento inicial de la app.
 */

import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

/**
 * Rutas hijas del contenedor de pestañas (`TabsPage`).
 * Se exportan para ser consumidas por `loadChildren` en `app.routes.ts`.
 */
export const routes: Routes = [
  {
    // Ruta raíz del contenedor: renderiza el shell de pestañas (TabsPage)
    // con todas sus rutas hijas como vistas intercambiables dentro de <ion-tabs>.
    path: '',
    component: TabsPage,
    children: [
      {
        // Pestaña "Inicio": Hub de bienestar, métricas y tests psicológicos (Tab2).
        path: 'inicio',
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        // Pestaña "Chat": Interfaz de conversación con la IA Guía SERENA (Tab1).
        path: 'chat',
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        // Pestaña "Agenda": Gestión y reserva de citas psicológicas.
        path: 'agenda',
        loadComponent: () => import('../agenda/agenda.page').then((m) => m.AgendaPage),
      },
      {
        // Pestaña "Perfil": Configuración personal, preferencias del chat y cierre de sesión (Tab3).
        path: 'perfil',
        loadComponent: () => import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        // Redirección por defecto: si el usuario navega a /tabs sin subrruta,
        // se le envía automáticamente a /tabs/inicio.
        path: '',
        redirectTo: '/tabs/inicio',
        pathMatch: 'full',
      },
    ],
  },
];