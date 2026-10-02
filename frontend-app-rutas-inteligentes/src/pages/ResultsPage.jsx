import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MapView from '../components/MapView';
import RouteCard from '../components/RouteCard';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const prefs = [
  { id: 'tiempo', label: 'Menor tiempo' },
  { id: 'costo', label: 'Menor costo' },
  { id: 'transbordos', label: 'Menos transbordos' },
];

export default function ResultsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [rutas, setRutas] = useState([]);
  const [coincidencia, setCoincidencia] = useState('catalogo');
  const [seleccion, setSeleccion] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const preferencia = params.get('preferencia') || 'tiempo';

  useEffect(() => {
    const query = new URLSearchParams({
      origen: params.get('origen') || '',
      destino: params.get('destino') || '',
      preferencia,
    });
    setCargando(true);
    api.get(`/api/rutas?${query.toString()}`, `rutas-${query.toString()}`)
      .then((data) => {
        setRutas(data.rutas || []);
        setCoincidencia(data.coincidencia);
        setSeleccion(data.rutas?.[0] || null);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [params, preferencia]);

  async function toggleFavorito(ruta) {
    if (!usuario) {
      navigate('/ingresar');
      return;
    }
    try {
      if (ruta.es_favorita) await api.delete(`/api/favoritos/${ruta.id_ruta}`);
      else await api.post('/api/favoritos', { id_ruta: ruta.id_ruta, alias: ruta.destino || ruta.nombre });
      setRutas((list) => list.map((item) => (item.id_ruta === ruta.id_ruta ? { ...item, es_favorita: !item.es_favorita } : item)));
      setSeleccion((item) => (item?.id_ruta === ruta.id_ruta ? { ...item, es_favorita: !item.es_favorita } : item));
    } catch (err) {
      setError(err.message);
    }
  }

  function cambiarPreferencia(id) {
    const next = new URLSearchParams(params);
    next.set('preferencia', id);
    setParams(next);
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <section className="flex w-full flex-col gap-5 lg:w-[520px] lg:shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">{cargando ? 'Buscando rutas…' : `${rutas.length} Rutas sugeridas`}</h1>
          <p className="text-sm text-[#475569]">{params.get('origen')} → {params.get('destino')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prefs.map((pref) => (
            <button
              key={pref.id}
              type="button"
              onClick={() => cambiarPreferencia(pref.id)}
              className={`rounded-full px-3 py-2 text-[13px] ${preferencia === pref.id ? 'border border-[#0252ff] bg-[#eef2ff] font-bold text-[#0252ff]' : 'border border-[#e2e8f0] bg-white font-medium text-[#475569]'}`}
            >
              {pref.label}
            </button>
          ))}
        </div>
        {coincidencia === 'sugerida' && (
          <p className="rounded-xl bg-[#fef3c7] px-3 py-2 text-sm text-[#92400e]">
            No hubo una coincidencia exacta. Estas son alternativas del catálogo.
          </p>
        )}
        {error && <p className="text-sm font-semibold text-[#ef4444]">{error}</p>}
        {rutas.map((ruta) => (
          <RouteCard
            key={ruta.id_ruta}
            ruta={ruta}
            activa={seleccion?.id_ruta === ruta.id_ruta}
            onAbrir={(item) => navigate(`/ruta/${item.id_ruta}`)}
            onFavorito={toggleFavorito}
          />
        ))}
      </section>
      <MapView paradas={seleccion?.paradas || []} className="min-h-[420px] flex-1 lg:min-h-[760px] lg:sticky lg:top-24" />
    </div>
  );
}
