import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CircleX, Heart, House, MapPin, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const desktopLinks = [
  { to: '/', label: 'Planificar Ruta', end: true },
  { to: '/lineas', label: 'Horarios y Líneas' },
  { to: '/alertas', label: 'Incidencias' },
  { to: '/portal', label: 'Portal Cívico' },
];

const mobileLinks = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/alertas', label: 'Alertas', icon: CircleX },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export default function AppShell() {
  const online = useOnline();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e2e8f0] bg-white px-4 lg:px-8">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
          <span className="grid size-10 place-items-center rounded-xl bg-[#0252ff] text-white shadow-[0_8px_8px_rgba(2,82,255,0.16)]">
            <MapPin size={22} />
          </span>
          <span>
            <span className="block text-xl font-extrabold leading-none">RutaLocal</span>
            <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#475569]">
              <span className={`size-1.5 rounded-full ${online ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
              PWA Activa ({online ? 'Online' : 'Offline'})
            </span>
          </span>
        </button>
        <nav className="hidden items-center gap-8 text-[15px] lg:flex">
          {desktopLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'font-bold text-[#0252ff]' : 'font-medium text-[#475569]')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={() => navigate(usuario ? '/ajustes' : '/ingresar')} className="flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-bold">{usuario?.nombre || 'Invitado'}</span>
            <span className="block text-[11px] text-[#475569]">{usuario?.etiqueta || 'Inicia sesión'}</span>
          </span>
          <span className="grid size-10 place-items-center rounded-full border-2 border-[#0252ff] bg-[#eef2ff] text-sm font-extrabold text-[#0252ff]">
            {(usuario?.nombre || 'IN').slice(0, 1).toUpperCase()}
          </span>
        </button>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-8">
        <Outlet context={{ online }} />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[72px] items-start justify-around border-t border-[#e2e8f0] bg-white pt-2 lg:hidden">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `flex w-[70px] flex-col items-center gap-1 text-[11px] ${isActive ? 'font-bold text-[#0252ff]' : 'font-medium text-[#475569]'}`}
            >
              <Icon size={20} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
