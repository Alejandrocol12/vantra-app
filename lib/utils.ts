import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return moneyFormatter.format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export const CATEGORIES = ['Desechable', 'Recargable', 'Pod', 'Líquido', 'Accesorio'] as const
export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi / Daviplata', 'Fiado', 'Otro'] as const
