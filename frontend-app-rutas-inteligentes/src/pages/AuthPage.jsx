import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputClass = 'w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[15px] outline-none focus:border-[#0252ff]';

export default function AuthPage() {
  const [modo, setModo] = useState('login');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { ingresar, registrar } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setCargando(true);
    try {
      if (modo === 'login') await ingresar(correo, password);
      else await registrar({ nombre, correo, password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f8fafc] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-[20px] bg-white p-7 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#0252ff] text-white shadow-[0_8px_8px_rgba(2,82,255,0.16)]">
            <MapPin size={22} />
          </span>
          <div>
            <p className="text-xl font-extrabold">RutaLocal</p>
            <p className="text-sm text-[#475569]">Encuentra la mejor alternativa de transporte</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold">{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <div className="mt-5 flex flex-col gap-3">
          {modo === 'registro' && (
            <label className="text-[13px] font-bold text-[#475569]">
              Nombre
              <input className={`${inputClass} mt-1.5`} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
          )}
          <label className="text-[13px] font-bold text-[#475569]">
            Correo
            <input type="email" className={`${inputClass} mt-1.5`} value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </label>
          <label className="text-[13px] font-bold text-[#475569]">
            Contraseña
            <input type="password" className={`${inputClass} mt-1.5`} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-[#ef4444]">{error}</p>}
        <button type="submit" disabled={cargando} className="mt-5 w-full rounded-[14px] bg-[#0252ff] py-4 font-bold text-white shadow-[0_8px_8px_rgba(2,82,255,0.16)] disabled:opacity-60">
          {cargando ? 'Espera un momento…' : modo === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
        <button
          type="button"
          className="mt-3 w-full text-sm font-bold text-[#0252ff]"
          onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); }}
        >
          {modo === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
        </button>
        <p className="mt-5 rounded-xl bg-[#f8fafc] p-3 text-xs leading-5 text-[#475569]">
          Pasajero de prueba: juan@rutafacil.com · Usuario123!
          <br />
          Administrador: admin@rutafacil.com · Admin123!
        </p>
      </form>
    </div>
  );
}
