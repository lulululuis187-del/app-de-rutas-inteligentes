import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCop, transfersLabel } from '../lib/format';

export default function LinesPage() {
  const [rutas, setRutas] = useState([]);
  const [transportes, setTransportes] = useState([]);

  useEffect(() => {
    api.get('/api/rutas', 'catalogo-rutas').then((data) => setRutas(data.rutas || [])).catch(() => {});
    api.get('/api/transportes', 'transportes').then((data) => setTransportes(data.transportes || [])).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Horarios y Líneas</h1>
        <p className="mt-1 text-sm text-[#475569]">Buses, metro y transporte integrado disponibles en el catálogo.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {transportes.map((item) => (
          <article key={item.id_transporte} className="rounded-2xl bg-white p-4 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold text-[#0252ff]">{item.tipo}</p>
            <h2 className="mt-1 font-extrabold">{item.nombre}</h2>
            <p className="text-sm text-[#475569]">{item.codigo}</p>
          </article>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase text-[#475569]">
            <tr>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Horario</th>
              <th className="px-4 py-3">Tiempo</th>
              <th className="px-4 py-3">Costo</th>
              <th className="hidden px-4 py-3 md:table-cell">Transbordos</th>
            </tr>
          </thead>
          <tbody>
            {rutas.map((ruta) => (
              <tr key={ruta.id_ruta} className="border-t border-[#e2e8f0]">
                <td className="px-4 py-3 font-bold">{ruta.nombre}</td>
                <td className="px-4 py-3 text-[#475569]">{ruta.horario}</td>
                <td className="px-4 py-3">{ruta.tiempo_estimado} min</td>
                <td className="px-4 py-3">{formatCop(ruta.costo_aproximado)}</td>
                <td className="hidden px-4 py-3 md:table-cell">{transfersLabel(ruta.transbordos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
