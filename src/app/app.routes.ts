/**
 * @file app.routes.ts
 * @description Configuración de rutas raíz de la aplicación SERENA.
 *
 * Utiliza lazy-loading (`loadComponent` / `loadChildren`) para que cada
 * página se cargue solo cuando el usuario la necesita, reduciendo el bundle
 * inicial y mejorando el tiempo de inicio en móviles.
 *
 * Árbol de rutas:
 * ```
 * ''         → redirige a /login (ruta de entrada segura)
 * /login     → LoginPage        (autenticación / registro)
 * /tabs      → TabsRoutes       (contenedor de pestañas con lazy children)
 * /agenda    → AgendaPage       (gestor de citas médicas)
 * ```
 */

// src/app/app.routes.ts

import { Routes } from '@angular/router';

/**
 * Rutas raíz de la aplicación.
 * Se exportan para ser consumidas por `provideRouter` en `main.ts`.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // Al abrir la app, vamos primero al Login
    pathMatch: 'full',
  },
  {
    // Ruta para el Login/SignIn (antes de las tabs)
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    // Ruta contenedora de pestañas; sus rutas hijas se definen en tabs/tabs.routes.ts
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes)
  },
  {
    // Ruta directa a la agenda; accesible también desde tabs/agenda como alias
    path: 'agenda',
    loadComponent: () => import('./agenda/agenda.page').then( m => m.AgendaPage)
  },
  {
    // NOTA: Esta ruta duplica '/login'. Angular usa la primera coincidencia,
    // por lo que esta entrada nunca se alcanza. Puede eliminarse sin efectos.
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  }
];