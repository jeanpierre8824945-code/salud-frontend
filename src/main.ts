/**
 * @file main.ts
 * @description Punto de entrada principal de la aplicación SERENA.
 *
 * Inicializa Angular en modo standalone (sin NgModules) usando
 * `bootstrapApplication`, que es el enfoque moderno y recomendado
 * a partir de Angular 14+.
 *
 * Proveedores globales configurados:
 * - `IonicRouteStrategy`: Reemplaza la estrategia de reutilización de rutas
 *   por defecto de Angular con la de Ionic, necesaria para que el ciclo de vida
 *   de los componentes (ionViewWillEnter, ionViewDidLeave, etc.) funcione
 *   correctamente en tabs y modales.
 * - `provideIonicAngular`: Registra todos los servicios globales de Ionic (gestos, config, etc.).
 * - `provideRouter`: Configura el enrutador con `PreloadAllModules` para que
 *   los módulos de lazy-load se descarguen en segundo plano una vez la app inicia,
 *   mejorando la velocidad de navegación percibida.
 * - `provideHttpClient`: Habilita el `HttpClient` en toda la aplicación sin necesidad
 *   de importar `HttpClientModule` en cada componente.
 */
import { provideHttpClient } from '@angular/common/http';

import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    // Sustituye la estrategia de reutilización de rutas de Angular por la de Ionic.
    // Sin esto, los hooks del ciclo de vida de Ionic no se ejecutarían correctamente.
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    // PreloadAllModules precarga los chunks de lazy-loading en background tras el arranque inicial.
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Registra HttpClient globalmente; permite inyectarlo en cualquier componente standalone.
    provideHttpClient(),
  ],
});
