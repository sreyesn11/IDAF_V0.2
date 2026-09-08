import { Component, type ErrorInfo, type ReactNode } from 'react';
import { idaf } from '../content/idaf';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Red de seguridad para errores lanzados FUERA del árbol de rutas (research D9).
 * Muestra el mismo mensaje amigable y una salida "Volver a Inicio" (un enlace
 * normal, porque aquí no hay contexto de router). El detalle va a
 * `console.error`, nunca al DOM (FR-020, FR-021).
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('IDAF: error fuera del árbol de rutas', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section aria-labelledby="root-error-heading">
          <h1 id="root-error-heading">{idaf.sectionErrorText}</h1>
          <p>
            <a href="/">{idaf.errorActions.backHome}</a>
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}
