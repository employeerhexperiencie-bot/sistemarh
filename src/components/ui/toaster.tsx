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

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === 'destructive';
        const errorCode = React.useMemo(
          () => isError ? generateErrorCode() : null,
          [id, isError]
        );

        if (isError && errorCode) {
          console.error(`[${errorCode}] Toast Error: ${typeof title === 'string' ? title : 'Erro'} - ${typeof description === 'string' ? description : ''}`);
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
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
