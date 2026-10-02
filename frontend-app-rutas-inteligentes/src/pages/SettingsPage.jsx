import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { usuario, salir } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Ajustes</h1>
      <section className="rounded-2xl bg-white p-5 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
        <p className="text-lg font-extrabold">{usuario?.nombre || 'Invitado'}</p>
        <p className="text-sm text-[#475569]">{usuario?.correo || 'Sin sesión'}</p>
        <p className="mt-1 text-xs font-bold text-[#0252ff]">{usuario?.etiqueta || 'Puedes buscar rutas sin cuenta'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {usuario ? (
            <button type="button" onClick={() => { salir(); navigate('/'); }} className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-bold">Cerrar sesión</button>
          ) : (
            <button type="button" onClick={() => navigate('/ingresar')} className="rounded-xl bg-[#0252ff] px-4 py-2 text-sm font-bold text-white">Iniciar sesión</button>
          )}
          {usuario?.rol === 'administrador' && (
            <button type="button" onClick={() => navigate('/admin')} className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white">Administrar sistema</button>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 text-sm text-[#475569]">
        <h2 className="font-extrabold text-[#0f172a]">Modo offline</h2>
        <p className="mt-2">RutaLocal guarda en este dispositivo las últimas rutas, favoritos y alertas consultadas. Si pierdes la conexión, el detalle del recorrido sigue disponible con la marca de modo offline.</p>
      </section>
    </div>
  );
}
