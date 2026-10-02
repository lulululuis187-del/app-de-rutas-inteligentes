import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const tones = {
  critica: 'border-[#ef4444] bg-[#fee2e2] text-[#991b1b]',
  advertencia: 'border-[#f59e0b] bg-[#fef3c7] text-[#92400e]',
  info: 'border-[#0252ff] bg-[#eef2ff] text-[#1e3a8a]',
};

export default function AlertsPage() {
  const [alertas, setAlertas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/alertas', 'alertas')
      .then((data) => setAlertas(data.alertas || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Incidencias</h1>
        <p className="mt-1 text-sm text-[#475569]">Retrasos y novedades cuando hay información disponible.</p>
      </div>
      {error && <p className="font-semibold text-[#ef4444]">{error}</p>}
      {alertas.length === 0 && !error && <p className="text-sm text-[#475569]">No hay alertas activas en este momento.</p>}
      {alertas.map((alerta) => (
        <article key={alerta.id_alerta} className={`rounded-2xl border p-4 ${tones[alerta.severidad] || tones.info}`}>
          <p className="text-xs font-extrabold uppercase">{alerta.severidad}</p>
          <h2 className="mt-1 text-lg font-extrabold">{alerta.titulo}</h2>
          <p className="mt-1 text-sm">{alerta.mensaje}</p>
          {alerta.ruta_nombre && <p className="mt-2 text-xs font-bold">Ruta: {alerta.ruta_nombre}</p>}
        </article>
      ))}
    </div>
  );
}
