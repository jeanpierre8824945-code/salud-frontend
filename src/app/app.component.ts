import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

/**
 * @component AppComponent
 * @description Componente raíz (shell) de la aplicación SERENA.
 *
 * Este componente actúa como contenedor de alto nivel y es extremadamente
 * deliberadamente simple: su única responsabilidad es renderizar el outlet
 * del router de Ionic (`<ion-router-outlet>`), que es quien inyecta los
 * componentes de cada ruta (login, tabs, agenda, etc.).
 *
 * No contiene lógica de negocio ni estado propio; cualquier lógica global
 * (guards, interceptores HTTP) debe registrarse en `main.ts` como providers.
 *
 * @selector app-root
 * @template app.component.html
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {}
}
