
import React, { useState, useMemo, useEffect } from 'react';
import { Player, FilterState, User, Recommendation, Position } from './types';
import PlayerCard from './components/PlayerCard';
import PlayerDetails from './components/PlayerDetails';
import AddPlayerModal from './components/AddPlayerModal';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import { dbService, isCloudActive } from './services/database';

const App: React.FC = () => {
  const SESSION_KEY = 'porto_vitoria_session_v2';

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

  // Carregamento de dados em tempo real (Sincronizado para todos)
  const loadData = async () => {
    if (!isCloudActive()) return;
    setLoading(true);
    try {
      const [allPlayers, allUsers] = await Promise.all([
        dbService.getPlayers(),
        dbService.getUsers()
      ]);
      setPlayers(allPlayers);
      setUsers(allUsers);
    } catch (err) {
      console.error("Falha na sincronização", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    await loadData(); // Recarrega para garantir sincronia
  };
  
  const handleUpdateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      const user = users.find(u => u.id === userId);
      if (user) {
        const updated = { ...user, status: 'approved' as const };
        await dbService.saveUser(updated);
      }
    } else {
      await dbService.deleteUser(userId);
    }
    await loadData();
  };

  const handleUpdateUser = async (updatedUser: User) => {
    await dbService.saveUser(updatedUser);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
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
    if(window.confirm("Apagar permanentemente este atleta para toda a equipe?")) {
      await dbService.deletePlayer(id);
      await loadData();
    }
  };

  const dynamicOptions = useMemo(() => {
    const comps = new Set<string>();
    const years = new Set<number>();
    players.forEach(p => {
      if (p.competition) comps.add(p.competition);
      if (p.scoutYear) years.add(p.scoutYear);
    });
    return {
      competitions: Array.from(comps).sort(),
      years: Array.from(years).sort((a, b) => b - a)
    };
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.club.toLowerCase().includes(filters.search.toLowerCase());
      const matchPos = filters.positions.length === 0 || 
                       filters.positions.includes(p.position1) || 
                       (p.position2 && filters.positions.includes(p.position2 as Position));
      const matchAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      const matchRec = filters.recommendations.length === 0 || filters.recommendations.includes(p.recommendation);
      const matchComp = filters.competitions.length === 0 || filters.competitions.includes(p.competition);
      const matchYear = filters.scoutYears.length === 0 || filters.scoutYears.includes(p.scoutYear);
      
      return matchSearch && matchPos && matchAge && matchRec && matchComp && matchYear;
    });
  }, [filters, players]);

  // Tela de erro caso não haja nuvem
  if (!isCloudActive()) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#050807] text-white p-6">
        <div className="max-w-md text-center space-y-6">
           <div className="h-20 w-20 rounded-full bg-red-600/20 flex items-center justify-center mx-auto text-red-500 text-3xl">
              <i className="fas fa-database"></i>
           </div>
           <h2 className="font-oswald text-2xl uppercase font-bold tracking-widest">Nuvem não configurada</h2>
           <p className="text-slate-400 text-sm leading-relaxed">
             O sistema de scout compartilhado exige uma conexão com o Supabase. 
             Configure as variáveis <code className="text-[#f1c40f]">SUPABASE_URL</code> e <code className="text-[#f1c40f]">SUPABASE_KEY</code> no painel da Vercel para continuar.
           </p>
           <div className="p-4 bg-slate-900 rounded-xl border border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
             Modo Offline desativado por segurança de dados
           </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#050807] text-white">
        <div className="flex flex-col items-center gap-6">
           <div className="h-16 w-16 border-4 border-[#006837] border-t-[#f1c40f] rounded-full animate-spin"></div>
           <h2 className="font-oswald text-xl uppercase tracking-widest animate-pulse">Acessando Nuvem Porto Vitória...</h2>
           <p className="text-[10px] text-slate-500 uppercase font-bold">Sincronizando dados da equipe</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} users={users} onRegister={handleRegister} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050807]">
      <header className="sticky top-0 z-40 border-b border-[#006837]/30 bg-[#0a0f0d]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow-lg border-2 border-[#006837]">
               <i className="fas fa-ship text-[#006837] text-xl"></i>
            </div>
            <div>
              <h1 className="font-oswald text-xl md:text-2xl font-bold uppercase tracking-tighter text-white">
                Porto Vitória <span className="text-[#f1c40f]">FC</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  Base de Dados em Nuvem (Sincronizada)
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[10px] font-black text-white uppercase">{currentUser.name}</span>
               <span className="text-[8px] font-bold text-[#006837] uppercase">{currentUser.role}</span>
            </div>
            
            <button onClick={loadData} className="p-2.5 rounded-lg bg-white/5 text-[#f1c40f] hover:bg-[#f1c40f] hover:text-black transition-all" title="Forçar Sincronização">
               <i className="fas fa-sync-alt text-xs"></i>
            </button>

            {currentUser.role === 'admin' && (
              <button onClick={() => setIsAdminPanelOpen(true)} className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all" title="Gerenciar Sistema">
                <i className="fas fa-users-cog text-xs"></i>
              </button>
            )}
            
            <button onClick={handleLogout} className="p-2.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all" title="Sair">
              <i className="fas fa-power-off text-xs"></i>
            </button>
            
            <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="hidden md:flex items-center gap-2 rounded-lg bg-[#006837] px-5 py-2.5 text-xs font-black text-white hover:bg-[#008a4a] uppercase tracking-widest shadow-lg">
              <i className="fas fa-plus"></i> Novo Atleta
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-7xl px-4 py-8 md:px-8 w-full">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-72 space-y-6">
            <div className="rounded-2xl bg-[#0a0f0d] p-6 border border-[#006837]/20 shadow-xl">
               <h2 className="mb-6 font-oswald text-lg font-bold uppercase text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <i className="fas fa-filter text-[#f1c40f]"></i> Filtros de Busca
              </h2>
              <div className="space-y-8">
                <div>
                  <label className="mb-2 block text-[9px] font-black text-slate-500 uppercase tracking-widest">Pesquisar Atleta/Clube</label>
                  <div className="relative">
                    <input 
                      type="text" value={filters.search} 
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} 
                      placeholder="Nome do jogador..." 
                      className="w-full rounded-xl bg-slate-900 border border-[#006837]/20 py-3 pl-10 pr-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#f1c40f]" 
                    />
                    <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]"></i>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   {Object.values(Position).slice(0, 8).map(pos => (
                      <button 
                        key={pos} 
                        onClick={() => setFilters(f => ({ ...f, positions: f.positions.includes(pos) ? f.positions.filter(p => p !== pos) : [...f.positions, pos] }))}
                        className={`py-2 rounded-lg text-[9px] font-black border transition-all ${filters.positions.includes(pos) ? 'bg-[#f1c40f] border-[#f1c40f] text-black' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                      >
                        {pos}
                      </button>
                   ))}
                </div>

                <button 
                  onClick={() => setFilters({search: '', positions: [], minAge: 14, maxAge: 40, recommendations: [], competitions: [], scoutYears: [],})} 
                  className="w-full py-3 text-[9px] font-black uppercase text-red-500 hover:text-red-400 border border-red-500/20 rounded-xl transition-all"
                >
                  <i className="fas fa-undo-alt mr-2"></i> Limpar Filtros
                </button>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <h3 className="font-oswald text-xl font-bold uppercase text-white tracking-wider">Atletas Cadastrados</h3>
                  <span className="rounded-full bg-[#006837] px-3 py-1 text-[10px] font-black text-white">{filteredPlayers.length}</span>
               </div>
            </div>

            {filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredPlayers.map(player => (
                  <div key={player.id} className="group relative">
                    <PlayerCard player={player} onClick={setSelectedPlayer} />
                    <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <button onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); setIsModalOpen(true); }} className="h-9 w-9 bg-[#f1c40f] text-black rounded-xl flex items-center justify-center shadow-lg hover:rotate-6 transition-transform"><i className="fas fa-pen text-[11px]"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }} className="h-9 w-9 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:-rotate-6 transition-transform"><i className="fas fa-trash text-[11px]"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 border border-dashed border-[#006837]/30 rounded-[3rem] bg-[#0a0f0d]/50">
                <i className="fas fa-users-slash text-3xl text-slate-700 mb-4"></i>
                <h3 className="text-xl font-oswald font-bold text-white uppercase tracking-wider">Nenhum registro encontrado</h3>
                <p className="text-[10px] text-slate-500 uppercase font-black mt-2">Clique em "Novo Atleta" para cadastrar o primeiro</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/5 bg-[#0a0f0d] py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 opacity-50">
            <i className="fas fa-ship text-white text-xs"></i>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Porto Vitória FC © {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Desenvolvido por <span className="text-[#f1c40f]">Henrique Bravim</span></p>
            <p className="text-[8px] text-slate-700 uppercase mt-1">Sistema de Scout em Nuvem</p>
          </div>
        </div>
      </footer>

      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && <AddPlayerModal player={editingPlayer || undefined} onClose={() => setIsModalOpen(false)} onAdd={handleAddPlayer} onUpdate={handleUpdatePlayer} />}
      {isAdminPanelOpen && (
        <AdminUserManagement 
          users={users} 
          players={players}
          onUpdateStatus={handleUpdateUserStatus} 
          onUpdateUser={handleUpdateUser}
          onClose={() => setIsAdminPanelOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
