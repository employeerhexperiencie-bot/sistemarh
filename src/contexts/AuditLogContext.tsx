import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  usuario: string;
  acao: 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'VISUALIZAR' | 'EXPORTAR';
  modulo: 'PROFISSIONAIS' | 'LOJAS' | 'VALES' | 'ADVERTENCIAS' | 'DOCUMENTOS' | 'FERIAS' | 'FALTAS' | 'ASO' | 'FOLHA' | 'AFASTAMENTOS' | 'EPI';
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

  const addLog = (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };

    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs];
      // Manter apenas os últimos MAX_LOGS registros
      return updatedLogs.slice(0, MAX_LOGS);
    });
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
