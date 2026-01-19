
import React, { useState, useMemo, useEffect } from 'react';
import { Player, FilterState, User, Recommendation, Position } from './types';
import PlayerCard from './components/PlayerCard';
import PlayerDetails from './components/PlayerDetails';
import AddPlayerModal from './components/AddPlayerModal';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import ShadowTeamModal from './components/ShadowTeamModal';
import ComparisonModal from './components/ComparisonModal';
import WatchlistPage from './components/WatchlistPage';
import ScoutingSchedulePage from './components/ScoutingSchedulePage';
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

  const [view, setView] = useState<'dashboard' | 'watchlist' | 'schedule'>('dashboard');

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShadowTeamOpen, setIsShadowTeamOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
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
    feet: [],
  });

  const loadData = async (isAutoRefresh = false) => {
    if (isAutoRefresh && (isModalOpen || isAdminPanelOpen || selectedPlayer || isShadowTeamOpen || isComparisonOpen || view !== 'dashboard')) return;
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
  }, [isModalOpen, isAdminPanelOpen, selectedPlayer, isShadowTeamOpen, isComparisonOpen, view]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  // Recalcula a idade dinamicamente baseado na data atual para todos os jogadores carregados
  const processedPlayers = useMemo(() => {
    return players.map(p => {
      if (!p.birthDate) return p;
      const today = new Date();
      const birth = new Date(p.birthDate);
      if (isNaN(birth.getTime())) return p;
      
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return { ...p, age };
    });
  }, [players]);

  const dynamicOptions = useMemo(() => {
    const competitions = [...new Set(processedPlayers.map(p => p.competition))].filter(Boolean).sort();
    const years = [...new Set(processedPlayers.map(p => p.scoutYear))].sort((a: number, b: number) => b - a);
    return { competitions, years };
  }, [processedPlayers]);

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
    return processedPlayers.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.club.toLowerCase().includes(filters.search.toLowerCase());
      const matchPos = filters.positions.length === 0 || filters.positions.includes(p.position1);
      const matchAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      const matchRec = filters.recommendations.length === 0 || filters.recommendations.includes(p.recommendation);
      const matchComp = filters.competitions.length === 0 || filters.competitions.includes(p.competition);
      const matchYear = filters.scoutYears.length === 0 || filters.scoutYears.includes(p.scoutYear);
      const matchFoot = filters.feet.length === 0 || filters.feet.includes(p.foot);

      return matchSearch && matchPos && matchAge && matchRec && matchComp && matchYear && matchFoot;
    });
  }, [filters, processedPlayers]);

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
      feet: [],
    });
  };

  const handleExportCSV = () => {
    if (filteredPlayers.length === 0) {
      alert("Nenhum jogador para exportar.");
      return;
    }

    const headers = [
      "Nome",
      "Competição",
      "Classificação",
      "Clube",
      "Nascimento",
      "Pé Dominante",
      "Posição",
      "Agente",
      "Jogos Vistos",
      "Link Vídeo"
    ];

    const csvRows = filteredPlayers.map(p => {
      const footLabel = p.foot === 'Right' ? 'Destro' : p.foot === 'Left' ? 'Canhoto' : 'Ambidestro';
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.competition.replace(/"/g, '""')}"`,
        `"${p.recommendation.replace(/"/g, '""')}"`,
        `"${p.club.replace(/"/g, '""')}"`,
        `"${p.birthDate}"`,
        `"${footLabel}"`,
        `"${p.position1}"`,
        `"${(p.agent || '').replace(/"/g, '""')}"`,
        p.gamesWatched,
        `"${(p.videoUrl || '').replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Jogadores_PVFC_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} users={users} onRegister={handleRegister} />;
  }

  if (view === 'watchlist') {
    return <WatchlistPage onBack={() => setView('dashboard')} />;
  }
  
  if (view === 'schedule') {
    return <ScoutingSchedulePage currentUser={currentUser} onBack={() => setView('dashboard')} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5 py-3">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center shrink-0 overflow-hidden bg-white rounded-lg p-0.5">
               <img 
                src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" 
                alt="Porto Vitória FC Logo" 
                className="h-full w-full object-contain"
                onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://www.ogol.com.br/img/logos/equipas/8682_imgbank.png';
                }}
               />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-oswald text-xl font-bold uppercase text-white tracking-tight leading-none">
                  PORTO VITÓRIA <span className="text-[#f1c40f]">FC</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-1 w-1 rounded-full bg-[#006837]"></span>
                <span className="text-[8px] font-black text-[#006837] uppercase tracking-[0.1em]">Departamento de Análise de Mercado</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6 mr-2">
               <div className="text-right">
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Analista Logado</p>
                  <p className="text-[9px] font-bold text-white uppercase">{currentUser.name}</p>
               </div>
               <div className="h-6 w-px bg-white/5"></div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' && (
                <button onClick={() => setIsAdminPanelOpen(true)} className="px-3 py-2 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-widest border border-orange-500/20 hover:bg-orange-500/20 transition-all">Admin</button>
              )}
              
              <button 
                onClick={() => setView('schedule')}
                className="bg-[#006837]/20 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-[#006837] hover:text-white hover:bg-[#006837] transition-all border border-[#006837]/30 flex items-center gap-2"
              >
                <i className="fas fa-calendar-alt"></i> Agenda
              </button>

              <button 
                onClick={() => setView('watchlist')}
                className="bg-white/5 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-[#f1c40f] hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2"
              >
                <i className="fas fa-binoculars"></i> Watchlist
              </button>

              <button 
                onClick={() => setIsComparisonOpen(true)}
                className="bg-slate-900 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-white/5 flex items-center gap-2"
              >
                <i className="fas fa-database"></i> Data Lab
              </button>

              <button 
                onClick={() => setIsShadowTeamOpen(true)}
                className="bg-[#1a2e22] px-4 py-2 rounded-lg text-[9px] font-black uppercase text-[#f1c40f] hover:bg-[#006837] hover:text-white transition-all shadow-lg border border-[#f1c40f]/20 flex items-center gap-2"
              >
                <i className="fas fa-chess-board"></i> Shadow Team
              </button>
              
              <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="bg-[#006837] px-5 py-2 rounded-lg text-[9px] font-black uppercase text-white hover:bg-[#008a4a] transition-all shadow-lg border border-[#006837]/30">Adicionar Atleta</button>
              <button onClick={handleLogout} className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20"><i className="fas fa-power-off text-xs"></i></button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow mx-auto max-w-[1600px] px-8 py-8 w-full flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="glass-panel p-8 rounded-[2rem] border border-white/5 shadow-2xl space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <i className="fas fa-filter text-[#006837] text-xs"></i>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em]">Filtros</h3>
                </div>
                <button onClick={clearFilters} className="text-[9px] font-black text-[#f1c40f] uppercase hover:underline underline-offset-4">Resetar</button>
              </div>

              <section>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Pesquisa</label>
                <div className="relative group">
                  <input 
                    type="text" value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} 
                    placeholder="Nome ou Clube..." 
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[12px] text-white outline-none focus:ring-1 focus:ring-[#006837] transition-all" 
                  />
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] group-focus-within:text-[#006837] transition-colors"></i>
                </div>
              </section>

              <section>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Prioridade</label>
                <div className="space-y-1.5">
                  {['G1 Elite', 'G2 Titular', 'G3 Monitoramento', 'Base'].map(rec => (
                    <button 
                      key={rec}
                      onClick={() => toggleFilter('recommendations', rec)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-[10px] font-black uppercase border transition-all flex items-center justify-between ${
                        filters.recommendations.includes(rec as Recommendation) 
                        ? 'bg-[#006837] border-[#006837] text-white' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
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
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Posições</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.values(Position).map(pos => (
                    <button 
                      key={pos} 
                      onClick={() => toggleFilter('positions', pos)}
                      className={`py-2 rounded bg-black/20 border border-white/5 text-[9px] font-black uppercase transition-all ${
                        filters.positions.includes(pos) 
                        ? 'bg-[#f1c40f] border-[#f1c40f] text-black shadow-sm' 
                        : 'text-slate-600 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Pé Dominante</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { val: 'Right', label: 'Destro' },
                    { val: 'Left', label: 'Canhoto' },
                    { val: 'Both', label: 'Ambidestro' }
                  ].map(f => (
                    <button 
                      key={f.val} 
                      onClick={() => toggleFilter('feet', f.val)}
                      className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase border transition-all flex items-center justify-between ${
                        filters.feet.includes(f.val as any) 
                        ? 'bg-[#006837] border-[#006837] text-white' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:text-white'
                      }`}
                    >
                      {f.label}
                      {filters.feet.includes(f.val as any) && <i className="fas fa-check text-[8px]"></i>}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Competição</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2 mt-2">
                  {dynamicOptions.competitions.length > 0 ? (
                    dynamicOptions.competitions.map(comp => (
                      <button 
                        key={comp} 
                        onClick={() => toggleFilter('competitions', comp)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[9px] font-black uppercase border transition-all flex items-center justify-between group ${
                          filters.competitions.includes(comp) 
                          ? 'bg-[#006837] border-[#006837] text-white' 
                          : 'bg-black/20 border-white/5 text-slate-600 hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{comp}</span>
                        {filters.competitions.includes(comp) ? (
                          <i className="fas fa-times-circle text-[10px] text-[#f1c40f] hover:scale-125 transition-transform"></i>
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-800 group-hover:bg-slate-600 transition-colors"></div>
                        )}
                      </button>
                    ))
                  ) : (
                    <span className="text-[9px] text-slate-700 italic px-2 block">Nenhuma registrada</span>
                  )}
                </div>
              </section>

              <section>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Faixa Etária</label>
                <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <input 
                    type="number" min="0" max="60" value={filters.minAge} 
                    onChange={e => setFilters(f => ({...f, minAge: parseInt(e.target.value) || 0}))}
                    className="w-full bg-transparent text-center text-[11px] font-black text-white outline-none" 
                  />
                  <div className="h-px w-3 bg-slate-800"></div>
                  <input 
                    type="number" min="0" max="60" value={filters.maxAge} 
                    onChange={e => setFilters(f => ({...f, maxAge: parseInt(e.target.value) || 60}))}
                    className="w-full bg-transparent text-center text-[11px] font-black text-white outline-none" 
                  />
                </div>
              </section>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-[8px] font-black text-[#006837] uppercase tracking-[0.3em] mb-1">Database</p>
              <h2 className="font-oswald text-2xl font-bold uppercase text-white tracking-tight leading-none">Jogadores Monitorados</h2>
            </div>
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleExportCSV}
                  className="hidden sm:flex bg-emerald-600/10 px-3 py-1.5 rounded-lg border border-emerald-600/20 items-center gap-2 text-[8px] font-black text-emerald-500 uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
               >
                  <i className="fas fa-file-csv"></i> Exportar CSV
               </button>
               <div className="hidden sm:flex bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 items-center gap-2">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Base Ativa:</span>
                  <span className="text-[8px] font-bold text-[#f1c40f] uppercase">{filteredPlayers.length} Resultados</span>
               </div>
            </div>
          </div>

          {loading && processedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-8 w-8 border-2 border-[#006837] border-t-[#f1c40f] rounded-full animate-spin mb-4"></div>
              <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Acessando Cloud...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPlayers.map(player => (
                <div key={player.id} className="group relative">
                  <PlayerCard player={player} onClick={setSelectedPlayer} />
                  <div className="absolute bottom-6 right-6 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); setIsModalOpen(true); }} 
                      className="h-9 w-9 bg-black/70 backdrop-blur-md text-white rounded-lg flex items-center justify-center border border-white/10 hover:bg-[#f1c40f] hover:text-black transition-all shadow-xl"
                    >
                      <i className="fas fa-pen text-[10px]"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }} 
                      className="h-9 w-9 bg-red-600/20 backdrop-blur-md text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-xl"
                    >
                      <i className="fas fa-trash text-[10px]"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-[2rem] border border-dashed border-white/5">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 text-slate-700">
                 <i className="fas fa-search text-xl"></i>
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">Nenhum registro encontrado</p>
              <button onClick={clearFilters} className="mt-4 text-[8px] font-black text-[#f1c40f] uppercase hover:underline underline-offset-4 transition-all">Redefinir Filtros</button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-8 flex items-center justify-between">
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.15em]">
            Porto Vitória FC Departamento de Análise de Mercado
          </p>
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.15em]">
            Sessão Ativa: <span className="text-slate-500">{currentUser.name}</span>
          </p>
        </div>
      </footer>

      {isShadowTeamOpen && currentUser && (
        <ShadowTeamModal 
          players={processedPlayers} 
          currentUser={currentUser} 
          onClose={() => setIsShadowTeamOpen(false)} 
        />
      )}
      {isComparisonOpen && <ComparisonModal onClose={() => setIsComparisonOpen(false)} />}
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
          players={processedPlayers} 
          onUpdateStatus={handleUpdateUserStatus} 
          onUpdateUser={handleUpdateUser} 
          onClose={() => setIsAdminPanelOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
