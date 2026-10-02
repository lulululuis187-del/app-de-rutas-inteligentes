import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { AlarmClock, ArrowLeft, ArrowLeftRight, Banknote, Bus, Heart, Share2 } from 'lucide-react';
import MapView from '../components/MapView';
import { api } from '../lib/api';
import { formatCop, transfersLabel } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const stepStyle = {
  caminar: 'bg-[#0252ff]',
  bus: 'bg-[#0252ff]',
  metro: 'bg-[#0252ff]',
  transbordo: 'bg-[#f59e0b]',
  llegada: 'bg-[#10b981]',
};

export default function RouteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { online } = useOutletContext() || { online: navigator.onLine };
  const [ruta, setRuta] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [desdeCache, setDesdeCache] = useState(false);

  useEffect(() => {
    api.get(`/api/rutas/${id}`, `ruta-${id}`)
      .then((data) => {
        setRuta(data.ruta);
        setDesdeCache(Boolean(data.desdeCache));
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function guardar() {
    if (!usuario) {
      navigate('/ingresar');
      return;
    }
    try {
      if (ruta.es_favorita) {
        await api.delete(`/api/favoritos/${ruta.id_ruta}`);
        setRuta({ ...ruta, es_favorita: false });
        setAviso('Ruta quitada de favoritos.');
      } else {
        await api.post('/api/favoritos', { id_ruta: ruta.id_ruta, alias: ruta.destino || ruta.nombre });
        setRuta({ ...ruta, es_favorita: true });
        setAviso('Ruta guardada. La verás en Favoritos y también sin conexión.');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function compartir() {
    const texto = `${ruta.nombre}: ${ruta.tiempo_estimado} min, ${formatCop(ruta.costo_aproximado)}, ${transfersLabel(ruta.transbordos)}. ${ruta.resumen || ''}`;
    if (navigator.share) {
      await navigator.share({ title: ruta.nombre, text: texto, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(texto);
    setAviso('Recorrido copiado para compartir.');
  }

  if (error && !ruta) return <p className="font-semibold text-[#ef4444]">{error}</p>;
  if (!ruta) return <p className="text-[#475569]">Cargando el recorrido…</p>;

  const offline = !online || desdeCache;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-extrabold">
        <ArrowLeft size={18} /> Detalle del Recorrido
      </button>
      {offline && (
        <div className="rounded-xl bg-[#fee2e2] px-4 py-2 text-[11px] font-semibold text-[#ef4444]">
          MODO OFFLINE · Navegando con datos almacenados en caché PWA
        </div>
      )}
      <section className="rounded-2xl bg-white p-4 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
        <h1 className="text-base font-extrabold">{ruta.nombre}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef2ff] px-2.5 py-1 text-[13px] font-bold"><AlarmClock size={14} /> {ruta.tiempo_estimado} min</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ecfdf5] px-2.5 py-1 text-[13px] font-bold"><Banknote size={14} /> {formatCop(ruta.costo_aproximado)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fef3c7] px-2.5 py-1 text-[13px] font-bold"><ArrowLeftRight size={14} /> {transfersLabel(ruta.transbordos)}</span>
        </div>
        <p className="mt-3 text-sm text-[#475569]">Caminata aproximada: {ruta.distancia_caminar} min · Horario: {ruta.horario}</p>
      </section>
      <MapView paradas={ruta.paradas || []} className="h-64" />
      <ol className="flex flex-col gap-4 rounded-2xl bg-white p-5">
        {(ruta.instrucciones || []).map((paso, index) => (
          <li key={paso.id_instruccion || index} className="flex gap-3">
            <span className="flex w-6 flex-col items-center">
              <span className={`grid size-5 place-items-center rounded-md text-white ${stepStyle[paso.tipo] || 'bg-[#0252ff]'}`}>
                {paso.tipo === 'llegada' || paso.tipo === 'caminar' ? <span className="size-2 rounded-full bg-white" /> : <Bus size={12} />}
              </span>
              {index < ruta.instrucciones.length - 1 && <span className="mt-1 h-10 w-0.5 bg-[#e2e8f0]" />}
            </span>
            <span>
              <span className="block text-sm font-bold">{paso.titulo}</span>
              <span className="block text-xs text-[#475569]">{paso.detalle}</span>
            </span>
          </li>
        ))}
      </ol>
      <section className="rounded-2xl bg-white p-4 text-sm text-[#475569]">
        <p className="font-bold text-[#0f172a]">Costo estimado del viaje</p>
        <p className="mt-1">Tarifa aproximada {formatCop(ruta.costo_aproximado)} en {ruta.transporte?.nombre || 'transporte público'} ({ruta.transporte?.tipo}).</p>
        <p>{ruta.transbordos > 0 ? `Incluye ${ruta.transbordos} transbordo${ruta.transbordos > 1 ? 's' : ''}.` : 'Sin transbordos.'} Estado: {ruta.estado_trafico}.</p>
      </section>
      {aviso && <p className="text-sm font-semibold text-[#0252ff]">{aviso}</p>}
      {error && <p className="text-sm font-semibold text-[#ef4444]">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={guardar} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-3 text-[13px] font-bold">
          <Heart size={16} fill={ruta.es_favorita ? '#ef4444' : 'none'} className={ruta.es_favorita ? 'text-[#ef4444]' : ''} />
          {ruta.es_favorita ? 'Guardada' : 'Guardar Ruta'}
        </button>
        <button type="button" onClick={compartir} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-3 text-[13px] font-bold">
          <Share2 size={16} /> Compartir
        </button>
      </div>
    </div>
  );
}
