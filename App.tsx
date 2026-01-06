
import React, { useState, useMemo, useEffect } from 'react';
import { Player, FilterState, User, Recommendation, Position } from './types';
import PlayerCard from './components/PlayerCard';
import PlayerDetails from './components/PlayerDetails';
import AddPlayerModal from './components/AddPlayerModal';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import { dbService, isCloudActive } from './services/database';

const App: React.FC = () => {
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
    minAge: 0,
    maxAge: 50,
    recommendations: [],
    competitions: [],
    scoutYears: [],
  });

  const loadData = async (isAutoRefresh = false) => {
    if (isAutoRefresh && (isModalOpen || isAdminPanelOpen || selectedPlayer)) return;
    if (!isCloudActive()) return;
    if (!isAutoRefresh) setLoading(true);

    try {
      const [allPlayers, allUsers] = await Promise.all([
        dbService.getPlayers(),
        dbService.getUsers()
      ]);
      setPlayers(allPlayers);
      setUsers(allUsers);
    } catch (err) {
      console.error("Erro ao carregar dados da nuvem:", err);
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 45000);
    return () => clearInterval(interval);
  }, [isModalOpen, isAdminPanelOpen, selectedPlayer]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const dynamicOptions = useMemo(() => {
    const competitions = [...new Set(players.map(p => p.competition))].filter(Boolean).sort();
    const years = [...new Set(players.map(p => p.scoutYear))].sort((a: number, b: number) => b - a);
    return { competitions, years };
  }, [players]);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);
  
  const handleRegister = async (newUser: User) => {
    try {
      await dbService.saveUser(newUser);
      await loadData();
    } catch (err: any) {
      alert("Erro ao registrar: " + err.message);
    }
  };
  
  const handleUpdateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') {
        const user = users.find(u => u.id === userId);
        if (user) {
          await dbService.saveUser({ ...user, status: 'approved' as const });
        }
      } else {
        await dbService.deleteUser(userId);
      }
      await loadData();
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await dbService.saveUser(updatedUser);
      if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
      await loadData();
    } catch (err: any) {
      alert("Erro ao atualizar usuário: " + err.message);
    }
  };

  const handleAddPlayer = async (newPlayer: Player) => {
    try {
      await dbService.savePlayer(newPlayer);
      await loadData(); 
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar jogador:", err);
      alert(`ERRO DE BANCO DE DADOS: ${err.message}`);
    }
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    try {
      await dbService.savePlayer(updatedPlayer);
      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`ERRO AO ATUALIZAR: ${err.message}`);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if(window.confirm("Apagar permanentemente este atleta na nuvem?")) {
      try {
        await dbService.deletePlayer(id);
        await loadData();
      } catch (err: any) {
        alert("Erro ao deletar: " + err.message);
      }
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.club.toLowerCase().includes(filters.search.toLowerCase());
      const matchPos = filters.positions.length === 0 || filters.positions.includes(p.position1);
      const matchAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      const matchRec = filters.recommendations.length === 0 || filters.recommendations.includes(p.recommendation);
      const matchComp = filters.competitions.length === 0 || filters.competitions.includes(p.competition);
      const matchYear = filters.scoutYears.length === 0 || filters.scoutYears.includes(p.scoutYear);

      return matchSearch && matchPos && matchAge && matchRec && matchComp && matchYear;
    });
  }, [filters, players]);

  const toggleFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => {
      const current = prev[key] as any[];
      const isPresent = current.includes(value);
      return {
        ...prev,
        [key]: isPresent ? current.filter(v => v !== value) : [...current, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      positions: [],
      minAge: 0,
      maxAge: 50,
      recommendations: [],
      competitions: [],
      scoutYears: [],
    });
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} users={users} onRegister={handleRegister} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Professional Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 py-4">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-8">
          <div className="flex items-center gap-5">
            {/* Logo Estilizado conforme imagem do usuário */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-[3px] border-[#006837] shadow-[0_0_15px_rgba(0,104,55,0.3)] shrink-0">
               <i className="fas fa-ship text-[#006837] text-2xl"></i>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-oswald text-2xl font-bold uppercase text-white tracking-tight leading-none">
                  PORTO VITÓRIA <span className="text-[#f1c40f]">FC</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006837]"></span>
                <span className="text-[9px] font-black text-[#006837] uppercase tracking-widest">Departamento de Análise de Mercado</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-8 mr-4">
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Analista Logado</p>
                  <p className="text-[10px] font-bold text-white uppercase">{currentUser.name}</p>
               </div>
               <div className="h-8 w-px bg-white/5"></div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser.role === 'admin' && (
                <button onClick={() => setIsAdminPanelOpen(true)} className="px-4 py-2.5 rounded-xl bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20 hover:bg-orange-500/20 transition-all">Central Admin</button>
              )}
              <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="bg-[#006837] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase text-white hover:bg-[#008a4a] transition-all shadow-xl shadow-[#006837]/20 border border-[#006837]/30">Adicionar Atleta</button>
              <button onClick={handleLogout} className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"><i className="fas fa-power-off"></i></button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-[1600px] px-8 py-10 w-full flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar de Filtros - "Technical dossier search" */}
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-28 space-y-6">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-3xl space-y-10">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <i className="fas fa-filter text-[#006837]"></i>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Filtros de Scout</h3>
                </div>
                <button onClick={clearFilters} className="text-[9px] font-black text-[#f1c40f] uppercase hover:underline underline-offset-4">Limpar</button>
              </div>

              <section>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-4 tracking-[0.3em]">Busca Nominal / Clube</label>
                <div className="relative group">
                  <input 
                    type="text" value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} 
                    placeholder="Filtrar base..." 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#006837] transition-all" 
                  />
                  <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-[11px] group-focus-within:text-[#006837] transition-colors"></i>
                </div>
              </section>

              <section>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-4 tracking-[0.3em]">Nível de Monitoramento</label>
                <div className="space-y-2.5">
                  {['G1 Elite', 'G2 Titular', 'G3 Monitoramento', 'Base'].map(rec => (
                    <button 
                      key={rec}
                      onClick={() => toggleFilter('recommendations', rec)}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center justify-between group ${
                        filters.recommendations.includes(rec as Recommendation) 
                        ? 'bg-[#006837] border-[#006837] text-white shadow-lg shadow-[#006837]/20' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:border-[#006837]/40 hover:text-slate-400'
                      }`}
                    >
                      {rec}
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        filters.recommendations.includes(rec as Recommendation) ? 'bg-white' : 'bg-slate-800'
                      }`}></div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-4 tracking-[0.3em]">Posicionamento Tático</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(Position).map(pos => (
                    <button 
                      key={pos} 
                      onClick={() => toggleFilter('positions', pos)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        filters.positions.includes(pos) 
                        ? 'bg-[#f1c40f] border-[#f1c40f] text-black shadow-lg shadow-[#f1c40f]/20' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-4 tracking-[0.3em]">Range de Idade: {filters.minAge} - {filters.maxAge}</label>
                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <input 
                    type="number" min="0" max="60" value={filters.minAge} 
                    onChange={e => setFilters(f => ({...f, minAge: parseInt(e.target.value) || 0}))}
                    className="w-full bg-transparent text-center text-xs font-black text-white outline-none" 
                  />
                  <div className="h-px w-6 bg-slate-800"></div>
                  <input 
                    type="number" min="0" max="60" value={filters.maxAge} 
                    onChange={e => setFilters(f => ({...f, maxAge: parseInt(e.target.value) || 60}))}
                    className="w-full bg-transparent text-center text-xs font-black text-white outline-none" 
                  />
                </div>
              </section>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between">
               <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Base Consolidada</p>
                  <p className="text-xl font-black text-white">{players.length} Atletas</p>
               </div>
               <div className="h-10 w-10 rounded-xl bg-[#006837]/10 flex items-center justify-center text-[#006837]">
                  <i className="fas fa-database text-lg"></i>
               </div>
            </div>
          </div>
        </aside>

        {/* Player Grid Area */}
        <div className="flex-1 space-y-10">
          <div className="flex items-end justify-between border-b border-white/5 pb-8">
            <div>
              <p className="text-[10px] font-black text-[#006837] uppercase tracking-[0.5em] mb-2">Technical Database</p>
              <h2 className="font-oswald text-4xl font-bold uppercase text-white tracking-tight">Portfólio de Atletas</h2>
            </div>
            <div className="flex gap-4">
               <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Filtros Ativos:</span>
                  <span className="text-[10px] font-bold text-[#f1c40f] uppercase">{filteredPlayers.length} Resultados</span>
               </div>
            </div>
          </div>

          {loading && players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="h-12 w-12 border-2 border-[#006837] border-t-[#f1c40f] rounded-full animate-spin mb-6"></div>
              <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Acessando Cloud do Porto Vitória...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredPlayers.map(player => (
                <div key={player.id} className="group relative">
                  <PlayerCard player={player} onClick={setSelectedPlayer} />
                  <div className="absolute bottom-6 right-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); setIsModalOpen(true); }} 
                      className="h-10 w-10 bg-black/60 backdrop-blur-md text-white rounded-xl flex items-center justify-center border border-white/10 hover:bg-[#f1c40f] hover:text-black transition-all shadow-2xl"
                    >
                      <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }} 
                      className="h-10 w-10 bg-red-600/10 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-2xl"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 glass-panel rounded-[3rem] border border-dashed border-white/5">
              <div className="h-20 w-20 rounded-3xl bg-slate-900 flex items-center justify-center mb-6 text-slate-700">
                 <i className="fas fa-search text-3xl"></i>
              </div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Nenhum atleta encontrado nos parâmetros atuais</p>
              <button onClick={clearFilters} className="mt-6 text-[10px] font-black text-[#f1c40f] uppercase hover:underline underline-offset-8 transition-all">Redefinir Filtros de Busca</button>
            </div>
          )}
        </div>
      </main>

      {/* Footer minimalista de Software */}
      <footer className="mt-auto py-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-8 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
            Porto Vitória FC Intelligence System <span className="text-slate-800 ml-4">v1.2.4 Premium</span>
          </p>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
            Analista: <span className="text-slate-500">{currentUser.name}</span>
          </p>
        </div>
      </footer>

      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && (
        <AddPlayerModal 
          player={editingPlayer || undefined} 
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddPlayer} 
          onUpdate={handleUpdatePlayer} 
        />
      )}
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
