import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, BriefcaseBusiness, Calendar, Clock, GraduationCap, Heart, LocateFixed, Search } from 'lucide-react';
import MapView from '../components/MapView';
import { api } from '../lib/api';
import { relativeTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const prefs = [
  { id: 'tiempo', label: 'Menor tiempo' },
  { id: 'costo', label: 'Menor costo' },
  { id: 'transbordos', label: 'Menos transbordos' },
];

const inputClass = 'flex w-full items-center gap-3 rounded-xl border bg-[#f8fafc] px-4 py-3 text-[15px] outline-none';

export default function HomePage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [origen, setOrigen] = useState('Mi ubicación actual (Plaza Central)');
  const [destino, setDestino] = useState('Terminal del Norte');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('09:45');
  const [preferencia, setPreferencia] = useState('tiempo');
  const [favoritos, setFavoritos] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/paradas/cercanas?lat=6.25184&lng=-75.56359', 'paradas-plaza')
      .then((data) => setParadas(data.paradas || []))
      .catch(() => setParadas([]));
  }, []);

  useEffect(() => {
    if (!usuario) {
      setFavoritos([]);
      setRecientes([]);
      return;
    }
    api.get('/api/favoritos', 'favoritos').then((data) => setFavoritos(data.favoritos || [])).catch(() => {});
    api.get('/api/busquedas', 'busquedas').then((data) => setRecientes(data.busquedas || [])).catch(() => {});
  }, [usuario]);

  function usarUbicacion() {
    if (!navigator.geolocation) {
      setOrigen('Mi ubicación actual (Plaza Central)');
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setOrigen('Mi ubicación actual');
      api.get(`/api/paradas/cercanas?lat=${latitude}&lng=${longitude}`, 'paradas-geo')
        .then((data) => setParadas(data.paradas || []))
        .catch(() => {});
    }, () => setOrigen('Mi ubicación actual (Plaza Central)'));
  }

  async function buscar(event) {
    event.preventDefault();
    if (!destino.trim()) {
      setError('Escribe un destino para buscar rutas.');
      return;
    }
    setError('');
    try {
      await api.post('/api/busquedas', {
        origen,
        destino,
        fecha_viaje: fecha,
        hora_salida: hora,
      });
    } catch {
      /* la búsqueda igual puede continuar sin conexión */
    }
    const params = new URLSearchParams({ origen, destino, preferencia, fecha, hora });
    navigate(`/resultados?${params.toString()}`);
  }

  function irFavorito(favorito) {
    const params = new URLSearchParams({
      origen: favorito.origen || origen,
      destino: favorito.destino || destino,
      preferencia: 'tiempo',
    });
    navigate(`/resultados?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
      <section className="flex w-full flex-col gap-6 rounded-[20px] bg-white p-5 shadow-[0_4px_6px_rgba(15,23,42,0.06)] lg:w-[420px] lg:shrink-0 lg:p-7">
        <div>
          <h1 className="text-2xl font-extrabold">¿A dónde viajas hoy?</h1>
          <p className="mt-1.5 text-sm text-[#475569]">Encuentra la mejor alternativa en tiempo real</p>
        </div>
        <form onSubmit={buscar} className="flex flex-col gap-4">
          <label className="text-[13px] font-bold text-[#475569]">
            Punto de origen
            <span className={`${inputClass} mt-1.5 border-[#e2e8f0]`}>
              <span className="size-2.5 rounded-full bg-[#10b981]" />
              <input className="w-full bg-transparent outline-none" value={origen} onChange={(e) => setOrigen(e.target.value)} list="lugares" />
            </span>
          </label>
          <label className="text-[13px] font-bold text-[#475569]">
            Punto de destino
            <span className={`${inputClass} mt-1.5 border-[#0252ff]`}>
              <span className="size-2.5 rounded-full bg-[#ef4444]" />
              <input className="w-full bg-transparent outline-none" value={destino} onChange={(e) => setDestino(e.target.value)} list="lugares" placeholder="Ingresa tu destino..." />
            </span>
          </label>
          <datalist id="lugares">
            <option value="Plaza Central" />
            <option value="Terminal del Norte" />
            <option value="Universidad" />
            <option value="Centro Comercial Portal" />
          </datalist>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs font-bold text-[#475569]">
              Fecha
              <span className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#f8fafc] p-3">
                <Calendar size={16} />
                <input type="date" className="w-full bg-transparent text-sm outline-none" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </span>
            </label>
            <label className="text-xs font-bold text-[#475569]">
              Hora de salida
              <span className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#f8fafc] p-3">
                <AlarmClock size={16} />
                <input type="time" className="w-full bg-transparent text-sm outline-none" value={hora} onChange={(e) => setHora(e.target.value)} />
              </span>
            </label>
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#475569]">Preferencias de viaje</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {prefs.map((pref) => (
                <button
                  key={pref.id}
                  type="button"
                  onClick={() => setPreferencia(pref.id)}
                  className={`rounded-full px-3 py-2 text-[13px] ${preferencia === pref.id ? 'border border-[#0252ff] bg-[#eef2ff] font-bold text-[#0252ff]' : 'border border-[#e2e8f0] bg-[#f8fafc] font-medium text-[#475569]'}`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-[#ef4444]">{error}</p>}
          <button type="submit" className="rounded-[14px] bg-[#0252ff] p-4 font-bold text-white shadow-[0_8px_8px_rgba(2,82,255,0.16)]">
            Buscar Rutas Inteligentes
          </button>
          <button type="button" onClick={usarUbicacion} className="inline-flex items-center gap-2 text-xs font-bold text-[#0252ff]">
            <LocateFixed size={14} /> Usar ubicación actual (Plaza Central)
          </button>
        </form>
      </section>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <MapView paradas={paradas} className="hidden min-h-[640px] lg:block" />

        <section className="lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <Search size={16} className="text-[#475569]" />
            <h2 className="text-sm font-extrabold">Tus Rutas Favoritas</h2>
          </div>
          {favoritos.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#475569] shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
              {usuario ? 'Todavía no guardas rutas. Busca un recorrido y márcalo con el corazón.' : 'Inicia sesión para ver y guardar tus rutas frecuentes.'}
            </p>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {favoritos.map((favorito, index) => {
                const Icon = index % 2 === 0 ? BriefcaseBusiness : GraduationCap;
                return (
                  <button key={favorito.id_favorito} type="button" onClick={() => irFavorito(favorito)} className="w-[170px] shrink-0 rounded-xl bg-white p-3 text-left shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
                    <span className="flex items-center justify-between">
                      <Icon size={16} />
                      <Heart size={14} className="text-[#ef4444]" fill="currentColor" />
                    </span>
                    <span className="mt-2 block text-sm font-bold">{favorito.alias || favorito.nombre}</span>
                    <span className="mt-1 block text-[11px] text-[#475569]">{favorito.transporte?.codigo || favorito.transporte?.tipo} · {favorito.tiempo_estimado} min</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:hidden">
          <h2 className="mb-2 text-sm font-extrabold">Destinos Recientes</h2>
          <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            {(recientes.length ? recientes : [
              { id_busqueda: 'demo-1', destino: 'Terminal del Norte', origen: 'Plaza Central', fecha_busqueda: new Date(Date.now() - 2 * 36e5).toISOString() },
              { id_busqueda: 'demo-2', destino: 'Centro Comercial Portal', origen: 'Plaza Central', fecha_busqueda: new Date(Date.now() - 26 * 36e5).toISOString() },
            ]).map((item, index, list) => (
              <button
                key={item.id_busqueda}
                type="button"
                onClick={() => {
                  setOrigen(item.origen);
                  setDestino(item.destino);
                }}
                className={`flex w-full items-center gap-3 p-3.5 text-left ${index < list.length - 1 ? 'border-b border-[#e2e8f0]' : ''}`}
              >
                <Clock size={16} className="text-[#475569]" />
                <span>
                  <span className="block text-sm font-bold">{item.destino}</span>
                  <span className="block text-[11px] text-[#475569]">{relativeTime(item.fecha_busqueda)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
