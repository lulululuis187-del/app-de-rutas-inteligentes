import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteCard from '../components/RouteCard';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function FavoritesPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) return;
    api.get('/api/favoritos', 'favoritos')
      .then((data) => setFavoritos(data.favoritos || []))
      .catch((err) => setError(err.message));
  }, [usuario]);

  async function quitar(ruta) {
    await api.delete(`/api/favoritos/${ruta.id_ruta}`);
    setFavoritos((list) => list.filter((item) => item.id_ruta !== ruta.id_ruta));
  }

  if (!usuario) {
    return (
      <div className="rounded-[20px] bg-white p-6 shadow-[0_4px_6px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-extrabold">Tus rutas favoritas</h1>
        <p className="mt-2 text-sm text-[#475569]">Inicia sesión para guardar recorridos y abrirlos directo.</p>
        <button type="button" onClick={() => navigate('/ingresar')} className="mt-4 rounded-[14px] bg-[#0252ff] px-5 py-3 font-bold text-white">Iniciar sesión</button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Tus Rutas Favoritas</h1>
      {error && <p className="text-sm font-semibold text-[#ef4444]">{error}</p>}
      {favoritos.length === 0 && <p className="text-sm text-[#475569]">Aún no hay rutas guardadas.</p>}
      {favoritos.map((ruta) => (
        <div key={ruta.id_favorito}>
          {ruta.alias && <p className="mb-2 text-sm font-bold text-[#0252ff]">{ruta.alias}</p>}
          <RouteCard ruta={{ ...ruta, es_favorita: true }} activa onAbrir={(item) => navigate(`/ruta/${item.id_ruta}`)} onFavorito={quitar} />
        </div>
      ))}
    </div>
  );
}
