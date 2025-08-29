import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  const centavos = parseInt(numericValue) || 0;
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const parseCurrencyToCentavos = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  return parseInt(numericValue) || 0;
};
