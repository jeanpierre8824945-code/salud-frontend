// src/app/tabs/tabs.routes.ts

import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio', // Mapeado de Tab2
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'chat', // Mapeado de Tab1
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'agenda', // La nueva pestaña
        loadComponent: () => import('../agenda/agenda.page').then((m) => m.AgendaPage),
      },
      {
        path: 'perfil', // Mapeado de Tab3 + Configuración
        loadComponent: () => import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: '/tabs/inicio', // Ruta por defecto dentro de tabs
        pathMatch: 'full',
      },
    ],
  },
];