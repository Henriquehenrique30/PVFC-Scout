
import React, { useState, useEffect, useMemo } from 'react';
import { ObservedPlayer, Position, User } from '../types';
import { dbService } from '../services/database';

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
      
      // Auto-seleciona o primeiro usuário como analista por padrão se disponível
      if (usersData.length > 0) setAssignedAnalystId(usersData[0].id);
    } catch (err) {
      console.error("Erro ao carregar watchlist cloud:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim() || !club.trim() || !assignedAnalystId) {
      alert("Preencha todos os campos, incluindo o analista responsável.");
      return;
    }

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
      created_at: new Date().toISOString()
    };

    try {
      await dbService.saveWatchlistItem(newItem);
      setName('');
      setClub('');
      loadData();
    } catch (err) {
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm("Remover este atleta do radar cloud?")) {
      try {
        await dbService.deleteWatchlistItem(id);
        loadData();
      } catch (err) {
        alert("Erro ao remover do banco de dados.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col animate-in fade-in duration-500">
      
      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black transition-all"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="font-oswald text-2xl font-bold uppercase tracking-tight">Watchlist <span className="text-[#006837]">Global</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Monitoramento em Tempo Real • Supabase Cloud</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {loading && (
               <div className="h-4 w-4 border-2 border-[#006837] border-t-transparent rounded-full animate-spin"></div>
             )}
            <span className="text-[9px] font-black text-[#f1c40f] uppercase tracking-widest bg-[#f1c40f]/10 px-3 py-1 rounded-full border border-[#f1c40f]/20">
              {list.length} Atletas em Radar
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-5xl w-full p-8 space-y-10">
        
        {/* Formulário de Cadastro Cloud */}
        <section className="glass-panel p-8 rounded-[2rem] border border-[#006837]/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <i className="fas fa-cloud text-8xl text-[#006837]"></i>
          </div>
          
          <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle"></i> Solicitar Análise de Radar
          </h3>

          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Atleta</label>
              <input 
                required
                type="text" 
                placeholder="Nome"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-[#f1c40f] transition-all"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Clube</label>
              <input 
                required
                type="text" 
                placeholder="Clube"
                value={club}
                onChange={e => setClub(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-[#006837] transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Posição</label>
              <select 
                value={position}
                onChange={e => setPosition(e.target.value as Position)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f1c40f] cursor-pointer"
              >
                {Object.values(Position).map(pos => (
                  <option key={pos} value={pos} className="bg-slate-900">{pos}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-[#f1c40f] uppercase mb-2 ml-1">Atribuir Analista</label>
              <select 
                value={assignedAnalystId}
                onChange={e => setAssignedAnalystId(e.target.value)}
                className="w-full bg-[#f1c40f]/5 border border-[#f1c40f]/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f1c40f] cursor-pointer"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id} className="bg-slate-900">{user.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button 
                type="submit"
                className="w-full h-[46px] bg-[#006837] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f1c40f] hover:text-black transition-all shadow-lg"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </form>
        </section>

        {/* Lista de Atletas Cloud */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Radar Compartilhado</h3>
             <p className="text-[8px] text-slate-700 italic uppercase">Sincronizado com o Banco de Dados</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {list.length > 0 ? (
              list.map(item => (
                <div 
                  key={item.id} 
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#006837]/30 transition-all hover:bg-white/[0.07] animate-in slide-in-from-top-2 gap-4"
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#006837] to-[#0a0f0d] flex items-center justify-center text-[#f1c40f] font-black shadow-lg shrink-0 text-xl">
                      {item.position}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-white uppercase truncate leading-none mb-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{item.club}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                       <p className="text-[8px] font-black text-[#006837] uppercase tracking-widest mb-1">Analista Responsável</p>
                       <div className="flex items-center gap-2 md:justify-end">
                         <span className="h-2 w-2 rounded-full bg-[#f1c40f] animate-pulse"></span>
                         <p className="text-[11px] font-black text-white uppercase tracking-wider">{item.assigned_analyst_name}</p>
                       </div>
                    </div>

                    <div className="hidden lg:block text-right border-l border-white/10 pl-8">
                       <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Solicitado por</p>
                       <p className="text-[10px] font-medium text-slate-400 uppercase">{item.created_by_name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="h-11 w-11 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                      >
                        <i className="fas fa-trash-alt text-base"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed border-white/5">
                 <i className="fas fa-cloud-sun text-5xl text-slate-800 mb-4"></i>
                 <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">O Radar Global está limpo</p>
                 <p className="text-[8px] text-slate-700 uppercase mt-2">Novas solicitações de análise aparecerão aqui para toda a equipe</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="py-10 border-t border-white/5 text-center">
         <div className="flex items-center justify-center gap-4 mb-4 opacity-30">
            <div className="h-1 w-12 bg-[#006837] rounded-full"></div>
            <img 
              src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" 
              className="h-6 grayscale"
              alt="Logo PVFC"
            />
            <div className="h-1 w-12 bg-[#006837] rounded-full"></div>
         </div>
         <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
           Porto Vitória FC • Departamento de Mercado • Sistema Cloud Sincronizado
         </p>
      </footer>
    </div>
  );
};

export default WatchlistPage;
