import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function PortalPage() {
  const { usuario } = useAuth();
  const [paradas, setParadas] = useState([]);
  const [transportes, setTransportes] = useState([]);

  useEffect(() => {
    api.get('/api/paradas/cercanas?lat=6.25184&lng=-75.56359&radio=8000', 'paradas-portal')
      .then((data) => setParadas(data.paradas || []))
      .catch(() => {});
    api.get('/api/transportes', 'transportes').then((data) => setTransportes(data.transportes || [])).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Portal Cívico</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#475569]">
          Consulta medios de transporte y paradas cercanas a Plaza Central. La información sale del catálogo que administra el equipo de Ruta Fácil.
        </p>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        {transportes.map((item) => (
          <article key={item.id_transporte} className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-bold uppercase text-[#0252ff]">{item.codigo}</p>
            <h2 className="mt-1 text-lg font-extrabold">{item.nombre}</h2>
            <p className="text-sm text-[#475569]">Tipo: {item.tipo}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
        <h2 className="font-extrabold">Paradas cercanas</h2>
        <ul className="mt-3 divide-y divide-[#e2e8f0]">
          {paradas.map((parada) => (
            <li key={parada.id_parada} className="flex items-center justify-between py-3 text-sm">
              <span>
                <span className="block font-bold">{parada.nombre}</span>
                <span className="text-[#475569]">{parada.ruta_nombre} · {parada.tipo}</span>
              </span>
              <span className="font-bold text-[#0252ff]">{parada.distancia_metros} m</span>
            </li>
          ))}
        </ul>
      </section>
      {usuario?.rol === 'administrador' && (
        <Link to="/admin" className="w-fit rounded-[14px] bg-[#0252ff] px-5 py-3 font-bold text-white">Abrir panel de administración</Link>
      )}
    </div>
  );
}
