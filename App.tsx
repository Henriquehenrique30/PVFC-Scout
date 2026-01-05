
import React, { useState, useMemo, useEffect } from 'react';
import { Player, FilterState, User, Recommendation, Position } from './types';
import PlayerCard from './components/PlayerCard';
import PlayerDetails from './components/PlayerDetails';
import AddPlayerModal from './components/AddPlayerModal';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import { dbService, isCloudActive } from './services/database';

const App: React.FC = () => {
  // SESSION_KEY mantido apenas para persistência temporária do login do navegador atual
  const SESSION_KEY = 'pvfc_auth_session';

  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    positions: [],
    minAge: 14,
    maxAge: 40,
    recommendations: [],
    competitions: [],
    scoutYears: [],
  });

  const loadData = async () => {
    if (!isCloudActive()) return;
    setLoading(true);
    try {
      // Busca dados reais diretamente do Supabase
      const [allPlayers, allUsers] = await Promise.all([
        dbService.getPlayers(),
        dbService.getUsers()
      ]);
      setPlayers(allPlayers);
      setUsers(allUsers);
    } catch (err) {
      console.error("Falha na sincronização cloud", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Opcional: Polling simples a cada 30s para manter dados frescos entre scouts
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);
  
  const handleRegister = async (newUser: User) => {
    await dbService.saveUser(newUser);
    await loadData();
  };
  
  const handleUpdateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      const user = users.find(u => u.id === userId);
      if (user) {
        await dbService.saveUser({ ...user, status: 'approved' as const });
      }
    } else {
      await dbService.deleteUser(userId);
    }
    await loadData();
  };

  const handleUpdateUser = async (updatedUser: User) => {
    await dbService.saveUser(updatedUser);
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
    await loadData();
  };

  const handleAddPlayer = async (newPlayer: Player) => {
    await dbService.savePlayer(newPlayer);
    await loadData();
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    await dbService.savePlayer(updatedPlayer);
    await loadData();
  };

  const handleDeletePlayer = async (id: string) => {
    if(window.confirm("Apagar permanentemente este atleta na nuvem para toda a equipe?")) {
      await dbService.deletePlayer(id);
      await loadData();
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.club.toLowerCase().includes(filters.search.toLowerCase());
      const matchPos = filters.positions.length === 0 || filters.positions.includes(p.position1);
      const matchAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      return matchSearch && matchPos && matchAge;
    });
  }, [filters, players]);

  if (!isCloudActive()) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#050807] text-white p-6">
        <div className="max-w-md text-center space-y-6">
           <div className="h-24 w-24 rounded-3xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 text-4xl shadow-2xl">
              <i className="fas fa-cloud-slash"></i>
           </div>
           <h2 className="font-oswald text-2xl uppercase font-bold tracking-widest text-white">Nuvem Pendente</h2>
           <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-4 text-left">
              <p className="text-slate-400 text-xs leading-relaxed">
                As credenciais da nuvem precisam do prefixo <code className="text-[#f1c40f]">VITE_</code> para serem acessadas pelo navegador.
              </p>
              <ul className="text-[10px] text-slate-500 uppercase font-black space-y-2">
                <li className="flex items-center gap-2"><i className="fas fa-check text-[#006837]"></i> Renomear para VITE_SUPABASE_URL</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-[#006837]"></i> Renomear para VITE_SUPABASE_KEY</li>
                <li className="flex items-center gap-2"><i className="fas fa-sync text-orange-500"></i> Fazer Redeploy na Vercel</li>
              </ul>
           </div>
        </div>
      </div>
    );
  }

  if (loading && players.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#050807] text-white">
        <div className="flex flex-col items-center gap-6">
           <div className="h-12 w-12 border-2 border-[#006837] border-t-[#f1c40f] rounded-full animate-spin"></div>
           <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Conectando ao Banco de Dados...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} users={users} onRegister={handleRegister} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050807]">
      <header className="sticky top-0 z-40 border-b border-[#006837]/20 bg-[#0a0f0d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white border-2 border-[#006837]">
               <i className="fas fa-ship text-[#006837] text-lg"></i>
            </div>
            <div>
              <h1 className="font-oswald text-xl font-bold uppercase text-white">
                Porto Vitória <span className="text-[#f1c40f]">FC</span>
              </h1>
              <span className="text-[8px] font-black text-[#006837] uppercase tracking-widest flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sistema Cloud Ativo
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={loadData} className="p-2 text-slate-500 hover:text-white transition-colors"><i className="fas fa-sync-alt text-xs"></i></button>
            {currentUser.role === 'admin' && (
              <button onClick={() => setIsAdminPanelOpen(true)} className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">Admin</button>
            )}
            <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="bg-[#006837] px-4 py-2 rounded-lg text-[10px] font-black uppercase text-white hover:bg-[#008a4a] transition-all">Novo Atleta</button>
            <button onClick={handleLogout} className="p-2 text-red-500/50 hover:text-red-500"><i className="fas fa-power-off text-xs"></i></button>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-7xl px-6 py-10 w-full">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-64 shrink-0 space-y-6">
            <div className="bg-[#0a0f0d] p-6 rounded-3xl border border-white/5 shadow-xl">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Filtros de Scout</h3>
               <div className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text" value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} 
                      placeholder="Buscar..." 
                      className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#f1c40f]" 
                    />
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]"></i>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(Position).slice(0, 10).map(pos => (
                      <button 
                        key={pos} 
                        onClick={() => setFilters(f => ({...f, positions: f.positions.includes(pos) ? f.positions.filter(p => p !== pos) : [...f.positions, pos]}))}
                        className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${filters.positions.includes(pos) ? 'bg-[#f1c40f] border-[#f1c40f] text-black' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredPlayers.map(player => (
                  <div key={player.id} className="group relative">
                    <PlayerCard player={player} onClick={setSelectedPlayer} />
                    <div className="absolute bottom-6 right-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <button onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); setIsModalOpen(true); }} className="h-8 w-8 bg-white/10 backdrop-blur-md text-white rounded-lg flex items-center justify-center border border-white/10 hover:bg-[#f1c40f] hover:text-black transition-all"><i className="fas fa-pen text-[10px]"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }} className="h-8 w-8 bg-red-600/10 backdrop-blur-md text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 bg-[#0a0f0d]/50 rounded-[3rem] border border-dashed border-white/5">
                <i className="fas fa-search text-3xl text-slate-800 mb-4"></i>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nenhum atleta encontrado</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && <AddPlayerModal player={editingPlayer || undefined} onClose={() => setIsModalOpen(false)} onAdd={handleAddPlayer} onUpdate={handleUpdatePlayer} />}
      {isAdminPanelOpen && <AdminUserManagement users={users} players={players} onUpdateStatus={handleUpdateUserStatus} onUpdateUser={handleUpdateUser} onClose={() => setIsAdminPanelOpen(false)} />}
    </div>
  );
};

export default App;
