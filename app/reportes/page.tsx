'use client'

import { useEffect, useState } from 'react'
import { FileDown, RefreshCw, DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import StockBar, { StockBadge } from '@/components/StockBar'
import { useToast, ToastContainer } from '@/components/Toast'
import { cn } from '@/lib/utils'

interface Summary { totalSales: number; units: number; profit: number; inventoryValue?: number; lowStock: number }
interface SaleRow { id: string; productName: string; quantity: number; payment: string; total: number; profit: number; date: string; note: string | null }
interface ProductRow { id: string; name: string; variantLabel: string | null; category: string; flavor: string | null; stock: number; minStock: number; price: number; cost: number }
interface ReportData { type: string; period: string; summary: Summary; sales: SaleRow[]; products: ProductRow[] }

const periods = [{ value: 'daily', label: 'Hoy' }, { value: 'weekly', label: 'Esta semana' }, { value: 'monthly', label: 'Este mes' }]

export default function ReportesPage() {
  const { messages, toast, dismiss } = useToast()
  const [type, setType] = useState('sales')
  const [period, setPeriod] = useState('daily')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try { setData(await fetch(`/api/reports?type=${type}&period=${period}`).then(r => r.json())) }
    finally { setLoading(false) }
  }

  useEffect(() => { generate() }, [])

  function exportCSV() {
    if (!data) return
    const rows = type === 'sales'
      ? data.sales.map(s => ({ Fecha: formatDate(s.date), Producto: s.productName, Cantidad: s.quantity, Pago: s.payment, Total: s.total, Ganancia: s.profit, Nota: s.note ?? '' }))
      : data.products.map(p => ({ Producto: p.name, Variante: p.variantLabel ?? '', Categoría: p.category, Stock: p.stock, Mínimo: p.minStock || 0, Costo: p.cost, Precio: p.price, 'Valor inventario': p.stock * p.price, Estado: p.minStock > 0 && p.stock < p.minStock ? 'Stock mínimo' : 'Disponible' }))
    if (!rows.length) { toast('No hay datos para exportar.', 'error'); return }
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `vantra-${type}-${period}-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
    toast('CSV exportado.')
  }

  async function exportPDF() {
    if (!data) return
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()
    const pl = periods.find(p => p.value === period)?.label ?? period
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('VANTRA', 14, 16)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`${type === 'sales' ? 'Reporte de Ventas' : 'Reporte de Inventario'} · ${pl}`, 14, 23)
    doc.text(`Generado: ${formatDate(new Date())}`, 14, 29)
    doc.setDrawColor(220, 220, 218); doc.line(14, 32, 196, 32)
    if (type === 'sales') {
      autoTable(doc, { startY: 36, head: [['Fecha', 'Producto', 'Cant.', 'Pago', 'Total', 'Ganancia']], body: data.sales.map(s => [formatDate(s.date), s.productName, s.quantity, s.payment, formatCurrency(s.total), formatCurrency(s.profit)]), styles: { fontSize: 8 }, headStyles: { fillColor: [24, 95, 165] }, alternateRowStyles: { fillColor: [245, 245, 242] } })
    } else {
      autoTable(doc, { startY: 36, head: [['Producto', 'Variante', 'Cat.', 'Stock', 'Mín.', 'Precio', 'Valor inv.', 'Estado']], body: data.products.map(p => [p.name, p.variantLabel ?? '—', p.category, p.stock, p.minStock || '—', formatCurrency(p.price), formatCurrency(p.stock * p.price), p.minStock > 0 && p.stock < p.minStock ? 'Stock mínimo' : 'Disponible']), styles: { fontSize: 8 }, headStyles: { fillColor: [24, 95, 165] }, alternateRowStyles: { fillColor: [245, 245, 242] } })
    }
    doc.save(`vantra-${type}-${period}-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast('PDF exportado.')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-0.5">Reportes</p>
        <h1>Generador de reportes</h1>
      </div>

      <div className="card p-4">
        <div className="flex gap-2 flex-wrap items-center">
          <select className="input text-[12px] w-32" value={type} onChange={e => setType(e.target.value)}>
            <option value="sales">Ventas</option>
            <option value="inventory">Inventario</option>
          </select>
          <select className="input text-[12px] w-36" value={period} onChange={e => setPeriod(e.target.value)}>
            {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={generate} disabled={loading} className="btn-primary">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generando…' : 'Generar'}
          </button>
          <button onClick={exportCSV} disabled={!data} className="btn"><FileDown size={13} /> CSV</button>
          <button onClick={exportPDF} disabled={!data} className="btn"><FileDown size={13} /> PDF</button>
        </div>
      </div>

      {data && (
        <>
          <div className={cn('grid grid-cols-2 gap-3', type === 'inventory' ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
            {(type === 'inventory'
              ? [
                  { label: 'Referencias', val: String(data.products.length) },
                  { label: 'Unidades en stock', val: String(data.summary.units) },
                  { label: 'Costo total (compra)', val: formatCurrency(data.summary.profit) },
                  { label: 'Valor inventario (venta)', val: formatCurrency(data.summary.inventoryValue ?? 0) },
                  { label: 'Productos en mínimo', val: String(data.summary.lowStock) },
                ]
              : [
                  { label: 'Total ventas', val: formatCurrency(data.summary.totalSales) },
                  { label: 'Unidades vendidas', val: String(data.summary.units) },
                  { label: 'Ganancia estimada', val: formatCurrency(data.summary.profit) },
                  { label: 'Productos en mínimo', val: String(data.summary.lowStock) },
                ]
            ).map(m => (
              <div key={m.label} className="metric">
                <p className="metric-label">{m.label}</p>
                <p className="metric-value">{m.val}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">{type === 'sales' ? 'Detalle de ventas' : 'Estado del inventario'}</span>
              <span className="text-[11px] text-muted">{type === 'sales' ? `${data.sales.length} ventas` : `${data.products.length} productos`}</span>
            </div>
            <div className="overflow-x-auto">
              {type === 'sales' ? (
                <table className="tbl">
                  <thead><tr>{['Fecha', 'Producto', 'Cant.', 'Pago', 'Total', 'Ganancia', 'Nota'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.sales.length === 0
                      ? <tr><td colSpan={7} className="empty-state">No hay ventas en este período.</td></tr>
                      : data.sales.map(s => (
                        <tr key={s.id}>
                          <td className="text-muted text-[11px] whitespace-nowrap">{formatDate(s.date)}</td>
                          <td className="font-medium">{s.productName}</td>
                          <td className="text-muted">{s.quantity}</td>
                          <td><span className="badge badge-info">{s.payment}</span></td>
                          <td className="font-semibold text-info">{formatCurrency(s.total)}</td>
                          <td className="text-success">{formatCurrency(s.profit)}</td>
                          <td className="text-muted text-[11px]">{s.note ?? '—'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              ) : (
                <table className="tbl">
                  <thead><tr>{['Producto', 'Categoría', 'Stock', 'Mín.', 'Costo', 'Precio', 'Valor inv.', 'Nivel', 'Estado'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.products.length === 0
                      ? <tr><td colSpan={9} className="empty-state">No hay productos.</td></tr>
                      : data.products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <p className="font-medium">{p.name}</p>
                            {p.variantLabel && <p className="text-[11px] text-brand">{p.variantLabel}</p>}
                            {p.flavor && <p className="text-[11px] text-muted">{p.flavor}</p>}
                          </td>
                          <td className="text-muted">{p.category}</td>
                          <td className="font-semibold">{p.stock}</td>
                          <td className="text-muted">{p.minStock || '—'}</td>
                          <td className="text-muted">{formatCurrency(p.cost)}</td>
                          <td>{formatCurrency(p.price)}</td>
                          <td className="font-semibold">{formatCurrency(p.stock * p.price)}</td>
                          <td><StockBar stock={p.stock} minStock={p.minStock} /></td>
                          <td><StockBadge stock={p.stock} minStock={p.minStock} /></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      <ToastContainer messages={messages} onDismiss={dismiss} />
    </div>
  )
}
