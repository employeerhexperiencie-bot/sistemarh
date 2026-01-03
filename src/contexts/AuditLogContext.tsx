import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  usuario: string;
  acao: 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'VISUALIZAR' | 'EXPORTAR';
  modulo: 'PROFISSIONAIS' | 'LOJAS' | 'VALES' | 'ADVERTENCIAS' | 'DOCUMENTOS' | 'FERIAS' | 'FALTAS' | 'ASO' | 'FOLHA' | 'AFASTAMENTOS' | 'EPI' | 'BENEFICIOS' | 'EMPRESTIMOS';
  entidade: string; // Nome ou identificador da entidade afetada
  detalhes: string;
  metadata?: Record<string, any>;
}

interface AuditLogContextType {
  logs: AuditLogEntry[];
  addLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  getLogsByModule: (modulo: AuditLogEntry['modulo']) => AuditLogEntry[];
  getLogsByEntity: (entidade: string) => AuditLogEntry[];
  getLogsByDateRange: (startDate: Date, endDate: Date) => AuditLogEntry[];
  exportLogs: () => void;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

const STORAGE_KEY = 'audit_logs';
const MAX_LOGS = 5000; // Limitar para não sobrecarregar localStorage

export const AuditLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar audit logs:', error);
      return [];
    }
  });

  // Persistir logs no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar audit logs:', error);
    }
  }, [logs]);

  // Função auxiliar para mapear ação para o formato do banco
  const mapAcaoToBanco = (acao: AuditLogEntry['acao']): string => {
    switch (acao) {
      case 'CRIAR': return 'criacao';
      case 'EDITAR': return 'atualizacao';
      case 'EXCLUIR': return 'exclusao';
      case 'VISUALIZAR': return 'visualizacao';
      case 'EXPORTAR': return 'exportacao';
      default: return 'outro';
    }
  };

  // Função auxiliar para mapear módulo para o formato do banco
  const mapModuloToBanco = (modulo: AuditLogEntry['modulo']): string => {
    return modulo.toLowerCase();
  };

  const addLog = async (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };

    // Atualizar estado local
    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs];
      return updatedLogs.slice(0, MAX_LOGS);
    });

    // Persistir no Supabase (assíncrono, não bloqueia UI)
    try {
      await supabase.from('historico_acoes').insert({
        acao: mapAcaoToBanco(log.acao),
        modulo: mapModuloToBanco(log.modulo),
        entidade_tipo: log.modulo,
        entidade_id: log.metadata?.id || newLog.id,
        entidade_nome: log.entidade,
        descricao: log.detalhes,
        usuario: log.usuario,
        dados_anteriores: log.metadata?.dados_anteriores || null,
        dados_novos: log.metadata?.dados_novos || null
      });
    } catch (error) {
      console.error('Erro ao salvar log no Supabase:', error);
    }
  };

  const clearLogs = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de alterações? Esta ação não pode ser desfeita.')) {
      setLogs([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getLogsByModule = (modulo: AuditLogEntry['modulo']) => {
    return logs.filter(log => log.modulo === modulo);
  };

  const getLogsByEntity = (entidade: string) => {
    return logs.filter(log => log.entidade.toLowerCase().includes(entidade.toLowerCase()));
  };

  const getLogsByDateRange = (startDate: Date, endDate: Date) => {
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  };

  const exportLogs = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Módulo', 'Entidade', 'Detalhes'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString('pt-BR'),
      log.usuario,
      log.acao,
      log.modulo,
      log.entidade,
      log.detalhes,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AuditLogContext.Provider
      value={{
        logs,
        addLog,
        clearLogs,
        getLogsByModule,
        getLogsByEntity,
        getLogsByDateRange,
        exportLogs,
      }}
    >
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLog deve ser usado dentro de AuditLogProvider');
  }
  return context;
};
