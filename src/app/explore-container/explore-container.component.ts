import { Component, Input } from '@angular/core';

/**
 * @component ExploreContainerComponent
 * @description Componente placeholder generado automáticamente por la CLI de Ionic.
 *
 * Originalmente sirve como contenedor de ejemplo para demostrar el uso de `@Input()`
 * en componentes standalone. En SERENA, este componente **no se usa activamente**
 * en ninguna vista de producción; se conserva únicamente como referencia del scaffold
 * inicial del proyecto.
 *
 * Si en el futuro se necesita un contenedor genérico reutilizable, este archivo
 * puede servir como punto de partida.
 *
 * @selector app-explore-container
 * @template explore-container.component.html
 */
@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
})
export class ExploreContainerComponent {
  /**
   * Nombre o etiqueta de contenido que puede pasarse desde el componente padre.
   * Es opcional (`?`); si no se provee, el componente muestra contenido por defecto.
   */
  @Input() name?: string;
}
