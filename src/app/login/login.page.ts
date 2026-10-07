/**
 * @file login/login.page.ts
 * @description Archivo de re-exportación para compatibilidad de rutas de importación.
 *
 * Este archivo existe porque `app.routes.ts` contiene una entrada duplicada para
 * la ruta `/login` que apunta a `'./login/login.page'` (esta carpeta) en lugar de
 * a `'./pages/login/login.page'` (la ubicación real del componente).
 *
 * Para evitar un error de importación en tiempo de compilación, este archivo
 * re-exporta todo el contenido del módulo real, actuando como un alias transparente.
 *
 * @remarks
 * La implementación real de `LoginPage` se encuentra en:
 * `src/app/pages/login/login.page.ts`
 *
 * Si en el futuro se corrige la ruta duplicada en `app.routes.ts`, este archivo
 * puede eliminarse de forma segura.
 */
export * from '../pages/login/login.page';
