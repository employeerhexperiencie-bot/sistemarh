import { toast } from '@/hooks/use-toast';
import { logErrorWithCode } from './errorCode';

/**
 * Shows a destructive toast with an auto-generated error code.
 * The full error is logged to console for debugging.
 * 
 * Usage:
 *   import { toastError } from '@/lib/toastError';
 *   toastError(error, 'Erro ao salvar loja');
 */
export function toastError(error: unknown, message: string, context?: string) {
  const code = logErrorWithCode(error, context || message);

  toast({
    title: 'Erro',
    description: `${message}\nCódigo: ${code}`,
    variant: 'destructive',
  });

  return code;
}
