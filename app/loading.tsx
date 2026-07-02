export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <p className="text-[12px] text-muted">Cargando…</p>
      </div>
    </div>
  )
}
