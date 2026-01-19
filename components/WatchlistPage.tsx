
import React, { useState, useEffect } from 'react';
import { ObservedPlayer, Position, User } from '../types';
import { dbService, supabase } from '../services/database';

interface WatchlistPageProps {
  onBack: () => void;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onBack }) => {
  const [list, setList] = useState<ObservedPlayer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [position, setPosition] = useState<Position>(Position.ATA);
  const [assignedAnalystId, setAssignedAnalystId] = useState<string>('');

  const currentUser: User | null = JSON.parse(localStorage.getItem('pvfc_auth_session') || 'null');

  const loadData = async () => {
    setLoading(true);
    try {
      const [watchlistData, usersData] = await Promise.all([
        dbService.getWatchlist(),
        dbService.getUsers()
      ]);
      setList(watchlistData);
      setUsers(usersData);
      
      if (usersData.length > 0 && !assignedAnalystId) setAssignedAnalystId(usersData[0].id);

      // MARCAR COMO VISUALIZADO
      if (currentUser) {
        const myPendingItems = watchlistData.filter(
          i => i.assigned_analyst_id === currentUser.id && i.status === 'pending'
        );
        for (const item of myPendingItems) {
          await dbService.updateWatchlistStatus(item.id, 'viewed');
        }
      }
    } catch (err) {
      console.error("Erro ao carregar watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!supabase) return;
    const channel = supabase
      .channel('watchlist_realtime_view')
      .on('postgres_changes', { event: '*', table: 'watchlist', schema: 'public' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !assignedAnalystId) return;

    const assignedAnalyst = users.find(u => u.id === assignedAnalystId);

    const newItem: ObservedPlayer = {
      id: crypto.randomUUID(),
      name: name.trim(),
      club: club.trim(),
      position: position,
      assigned_analyst_id: assignedAnalystId,
      assigned_analyst_name: assignedAnalyst?.name || 'Desconhecido',
      created_by_id: currentUser.id,
      created_by_name: currentUser.name,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    try {
      await dbService.saveWatchlistItem(newItem);
      setName('');
      setClub('');
    } catch (err) {
      alert("Erro ao enviar para análise.");
    }
  };

  const handleToggleStatus = async (item: ObservedPlayer) => {
    const nextStatus = item.status === 'completed' ? 'viewed' : 'completed';
    try {
      await dbService.updateWatchlistStatus(item.id, nextStatus);
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm("Remover solicitação?")) {
      try {
        await dbService.deleteWatchlistItem(id);
      } catch (err) {
        alert("Erro ao remover.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col">
      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black">
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="font-oswald text-2xl font-bold uppercase">Radar <span className="text-[#006837]">PVFC</span></h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl w-full p-8 space-y-8">
        <section className="glass-panel p-8 rounded-[2rem] border border-[#006837]/20 shadow-2xl">
          <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-widest mb-6">Solicitar Análise de Jogador</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <input required type="text" placeholder="Atleta" value={name} onChange={e => setName(e.target.value)} className="md:col-span-3 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f1c40f]" />
            <input required type="text" placeholder="Clube" value={club} onChange={e => setClub(e.target.value)} className="md:col-span-3 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006837]" />
            <select value={position} onChange={e => setPosition(e.target.value as Position)} className="md:col-span-2 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none">
              {Object.values(Position).map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
            <select value={assignedAnalystId} onChange={e => setAssignedAnalystId(e.target.value)} className="md:col-span-3 bg-[#f1c40f]/5 border border-[#f1c40f]/20 rounded-xl px-4 py-3 text-sm outline-none">
              {users.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
            </select>
            <button type="submit" className="md:col-span-1 bg-[#006837] rounded-xl hover:bg-[#f1c40f] hover:text-black transition-all"><i className="fas fa-plus"></i></button>
          </form>
        </section>

        <div className="grid grid-cols-1 gap-4">
          {list.map(item => {
            const isMine = item.assigned_analyst_id === currentUser?.id;
            const isPending = item.status === 'pending';
            const isCompleted = item.status === 'completed';

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-2xl bg-white/5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isMine && isPending ? 'border-[#f1c40f] bg-[#f1c40f]/5' : 'border-white/5'
                } ${isCompleted ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black ${isCompleted ? 'bg-slate-800' : 'bg-[#006837]'}`}>
                    {item.position}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white uppercase">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{item.club} • <span className="text-[#f1c40f]">{item.assigned_analyst_name}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isMine && (
                    <button onClick={() => handleToggleStatus(item)} className={`h-10 px-4 rounded-lg text-[9px] font-black uppercase border ${isCompleted ? 'border-[#006837] text-[#006837]' : 'border-white/10 text-slate-400'}`}>
                      {isCompleted ? 'Finalizado' : 'Marcar Concluído'}
                    </button>
                  )}
                  <button onClick={() => handleRemove(item.id)} className="h-10 w-10 bg-red-600/10 text-red-500 rounded-lg"><i className="fas fa-trash-alt"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default WatchlistPage;
