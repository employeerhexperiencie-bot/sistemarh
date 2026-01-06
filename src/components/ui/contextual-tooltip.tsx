import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContextualTooltipProps {
  content: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  showIcon?: boolean
  iconClassName?: string
}

export function ContextualTooltip({
  content,
  children,
  side = "top",
  showIcon = false,
  iconClassName,
}: ContextualTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 cursor-help">
            {children}
            {showIcon && (
              <HelpCircle className={cn("h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors", iconClassName)} />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Tooltip wrapper for icons/buttons
interface IconTooltipProps {
  content: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function IconTooltip({ content, children, side = "top" }: IconTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Pre-defined tooltips for common system elements
export const systemTooltips = {
  // Dashboard
  vales: "Soma de Vale Transporte + Vale Refeição + Cesta Básica para todos os profissionais ativos",
  adiantamentos: "Valor previsto para pagamento no dia 20 (40% do salário para elegíveis)",
  totalReceber: "Soma total de salários líquidos previstos para o mês atual",
  faltas: "Total de ausências registradas no mês, divididas entre justificadas e injustificadas",
  holerites: "Contracheques gerados, enviados e assinados pelos profissionais",
  
  // Gestão
  ferias: "Controle de períodos aquisitivos, programação e gozo de férias",
  afastamentos: "Licenças médicas, maternidade, acidentes e outros afastamentos",
  aso: "Atestados de Saúde Ocupacional - admissionais, periódicos e demissionais",
  epi: "Equipamentos de Proteção Individual entregues aos profissionais",
  beneficios: "Vale Transporte, Vale Refeição e Cesta Básica por profissional",
  
  // Folha
  lancamentos: "Proventos e descontos extras a serem incluídos na folha de pagamento",
  emprestimos: "Controle de empréstimos consignados e descontos em folha",
  pendencias: "Documentos e ações pendentes que precisam de atenção",
  
  // Simulador
  simulador: "Simule o custo total da folha antes do fechamento oficial",
  
  // Alertas
  alertas: "Notificações automáticas sobre vencimentos, pendências e situações críticas",
  
  // Header
  competencia: "Mês de referência para cálculos e lançamentos da folha",
  busca: "Busque por nome, matrícula ou CPF de profissionais",
  notificacoes: "Documentos próximos do vencimento e alertas importantes",
}
