export function formatCop(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function transfersLabel(count) {
  const total = Number(count || 0);
  if (total <= 0) return 'Directo';
  return total === 1 ? '1 transb.' : `${total} transb.`;
}

export function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = Math.round((Date.now() - date.getTime()) / 36e5);
  if (hours < 1) return 'Hace unos minutos';
  if (hours < 24) return `Hace ${hours} h`;
  if (hours < 48) return 'Ayer';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function trafficTone(text = '') {
  if (/obra|retraso|demora|cierre/i.test(text)) return 'text-[#ef4444]';
  if (/fluido|normal|operativo/i.test(text)) return 'text-[#10b981]';
  return 'text-[#475569]';
}
