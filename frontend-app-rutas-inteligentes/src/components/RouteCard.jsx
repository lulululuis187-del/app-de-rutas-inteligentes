import { AlarmClock, ArrowLeftRight, Banknote, Heart } from 'lucide-react';
import { formatCop, trafficTone, transfersLabel } from '../lib/format';

export default function RouteCard({ ruta, activa, onAbrir, onFavorito }) {
  return (
    <article className={`flex w-full flex-col gap-3.5 rounded-2xl bg-white p-5 shadow-[0_4px_6px_rgba(15,23,42,0.06)] ${activa ? 'border-2 border-[#0252ff]' : 'border border-[#e2e8f0]'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#0252ff]">
          {ruta.etiqueta_activa || ruta.etiqueta || ruta.transporte?.tipo}
        </span>
        <span className={`text-[13px] font-bold ${trafficTone(ruta.estado_trafico)}`}>
          {ruta.estado_trafico || ruta.horario}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-extrabold text-[#0f172a]">{ruta.nombre}</h3>
        <button
          type="button"
          aria-label={ruta.es_favorita ? 'Quitar de favoritos' : 'Guardar ruta'}
          onClick={() => onFavorito?.(ruta)}
          className={`grid size-8 shrink-0 place-items-center rounded-full ${ruta.es_favorita ? 'text-[#ef4444]' : 'text-[#475569]'}`}
        >
          <Heart size={16} fill={ruta.es_favorita ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef2ff] px-2.5 py-1 text-[13px] font-bold">
          <AlarmClock size={14} /> {ruta.tiempo_estimado} min
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ecfdf5] px-2.5 py-1 text-[13px] font-bold">
          <Banknote size={14} /> {formatCop(ruta.costo_aproximado)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fef3c7] px-2.5 py-1 text-[13px] font-bold">
          <ArrowLeftRight size={14} /> {transfersLabel(ruta.transbordos)}
        </span>
      </div>
      {ruta.resumen && (
        <>
          <div className="h-px w-full bg-[#e2e8f0]" />
          <p className="text-[13px] text-[#475569]">{ruta.resumen}</p>
        </>
      )}
      <button
        type="button"
        onClick={() => onAbrir?.(ruta)}
        className="rounded-[10px] bg-[#0252ff] px-5 py-3 text-sm font-bold text-white"
      >
        Iniciar Navegación Guía
      </button>
    </article>
  );
}
