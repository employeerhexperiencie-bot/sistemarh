import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { generateErrorCode } from "@/lib/errorCode"
import { Copy } from "lucide-react"
import React from "react"

// Stable error code cache — avoids hooks inside .map()
const errorCodeCache = new Map<string, string>();

function ErrorCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono bg-background/20 hover:bg-background/30 px-2 py-0.5 rounded transition-colors cursor-pointer border-none"
      title="Copiar código do erro"
    >
      <Copy className="h-3 w-3" />
      {copied ? 'Copiado!' : code}
    </button>
  );
}

export function Toaster() {
  const { toasts } = useToast()

  // Clean up cache for removed toasts
  const currentIds = new Set(toasts.map(t => t.id));
  errorCodeCache.forEach((_, key) => {
    if (!currentIds.has(key)) errorCodeCache.delete(key);
  });

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === 'destructive';
        
        let errorCode: string | null = null;
        if (isError) {
          if (!errorCodeCache.has(id)) {
            errorCodeCache.set(id, generateErrorCode());
          }
          errorCode = errorCodeCache.get(id)!;
          console.error(`[${errorCode}] Toast Error: ${typeof title === 'string' ? title : 'Erro'} - ${typeof description === 'string' ? description : ''}`);
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{String(title)}</ToastTitle>}
              {description && (
                <ToastDescription>{String(description)}</ToastDescription>
              )}
              {isError && errorCode && (
                <ErrorCodeBadge code={errorCode} />
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
