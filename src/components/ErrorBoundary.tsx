import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import { generateErrorCode } from '@/lib/errorCode';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCode: string | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorCode: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorCode = generateErrorCode();
    return { hasError: true, error, errorCode };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[${this.state.errorCode}] ${new Date().toISOString()} | ErrorBoundary`,
      error.message,
      errorInfo.componentStack
    );
  }

  handleReload = () => {
    try {
      localStorage.removeItem('profissionaisImportados');
      localStorage.removeItem('lojasImportadas');
      localStorage.removeItem('lojas');
    } catch {}
    window.location.reload();
  };

  handleCopyCode = () => {
    if (this.state.errorCode) {
      navigator.clipboard.writeText(this.state.errorCode);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            {this.state.errorCode && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-mono font-bold bg-destructive/10 text-destructive px-3 py-1.5 rounded-md">
                  {this.state.errorCode}
                </span>
                <Button variant="ghost" size="sm" onClick={this.handleCopyCode} className="h-8 w-8 p-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <pre className="text-xs text-left bg-muted p-3 rounded-lg overflow-auto max-h-32">
              {this.state.error?.message}
            </pre>
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar página
            </Button>
            <p className="text-xs text-muted-foreground">
              Informe o código de erro ao suporte para agilizar a resolução.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
