
import React, { useState, useMemo, useEffect } from 'react';
import { Player, FilterState, User, Recommendation, Position, ObservedPlayer } from './types';
import PlayerCard from './components/PlayerCard';
import PlayerDetails from './components/PlayerDetails';
import AddPlayerModal from './components/AddPlayerModal';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';
import ShadowTeamModal from './components/ShadowTeamModal';
import ComparisonModal from './components/ComparisonModal';
import WatchlistPage from './components/WatchlistPage';
import ScoutingSchedulePage from './components/ScoutingSchedulePage';
import { dbService, isCloudActive, supabase } from './services/database';

const App: React.FC = () => {
  const SESSION_KEY = 'pvfc_auth_session';

  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsCount, setNotificationsCount] = useState(0);
  
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

  // SISTEMA DE NOTIFICAÇÕES EM TEMPO REAL
  useEffect(() => {
    if (!currentUser || !supabase) return;

    const syncNotifications = async () => {
      const items = await dbService.getWatchlist();
      const pendingForMe = items.filter(
        i => i.assigned_analyst_id === currentUser.id && i.status === 'pending'
      ).length;
      setNotificationsCount(pendingForMe);
    };

    syncNotifications();

    // Inscreve no canal do Supabase Realtime
    const channel = supabase
      .channel('watchlist_changes')
      .on(
        'postgres_changes',
        { event: '*', table: 'watchlist', schema: 'public' },
        (payload) => {
          syncNotifications();
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ObservedPlayer;
            if (newItem.assigned_analyst_id === currentUser.id) {
              // Notificação sonora ou visual pode ser adicionada aqui
              console.log("Nova análise atribuída a você!");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, view]);

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
    const interval = setInterval(() => loadData(true), 60000);
    return () => clearInterval(interval);
  }, [isModalOpen, isAdminPanelOpen, selectedPlayer, isShadowTeamOpen, isComparisonOpen, view]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

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
      alert(`ERRO AO SALVAR: ${err.message}`);
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
                alt="Logo PVFC" 
                className="h-full w-full object-contain"
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
                <span className="text-[8px] font-black text-[#006837] uppercase tracking-[0.1em]">Análise de Mercado</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView('watchlist')}
                className={`relative px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all border flex items-center gap-2 ${
                  notificationsCount > 0 
                  ? 'bg-[#f1c40f] text-black border-[#f1c40f] shadow-[0_0_15px_rgba(241,196,15,0.4)] animate-pulse' 
                  : 'bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                <i className="fas fa-binoculars"></i> Radar
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white border border-black animate-bounce">
                    {notificationsCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setView('schedule')}
                className="bg-white/5 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-slate-300 hover:text-white border border-white/5"
              >
                <i className="fas fa-calendar-alt"></i> Agenda
              </button>

              <button 
                onClick={() => setIsComparisonOpen(true)}
                className="bg-slate-900 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-slate-300 border border-white/5"
              >
                <i className="fas fa-database"></i> Data Lab
              </button>

              <button 
                onClick={() => setIsShadowTeamOpen(true)}
                className="bg-[#1a2e22] px-4 py-2 rounded-lg text-[9px] font-black uppercase text-[#f1c40f] border border-[#f1c40f]/20"
              >
                <i className="fas fa-chess-board"></i> Shadow Team
              </button>
              
              <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="bg-[#006837] px-5 py-2 rounded-lg text-[9px] font-black uppercase text-white shadow-lg">Adicionar</button>
              <button onClick={handleLogout} className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-power-off text-xs"></i></button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow mx-auto max-w-[1600px] px-8 py-8 w-full flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-80 shrink-0">
          <div className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-6">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-filter text-[#006837]"></i> Filtros
            </h3>
            
            <section>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Pesquisa</label>
              <input 
                type="text" value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} 
                placeholder="Nome ou Clube..." 
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-[12px] text-white outline-none" 
              />
            </section>

            <section>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Posições</label>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.values(Position).map(pos => (
                  <button 
                    key={pos} 
                    onClick={() => toggleFilter('positions', pos)}
                    className={`py-2 rounded text-[9px] font-black uppercase transition-all ${
                      filters.positions.includes(pos) ? 'bg-[#f1c40f] text-black' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </section>

            <button onClick={clearFilters} className="w-full py-3 text-[9px] font-black text-slate-600 uppercase hover:text-white transition-colors">Limpar Tudo</button>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-8 w-8 border-2 border-[#006837] border-t-[#f1c40f] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPlayers.map(player => (
                <PlayerCard key={player.id} player={player} onClick={setSelectedPlayer} />
              ))}
            </div>
          )}
        </div>
      </main>

      {isShadowTeamOpen && currentUser && (
        <ShadowTeamModal players={processedPlayers} currentUser={currentUser} onClose={() => setIsShadowTeamOpen(false)} />
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
    </div>
  );
};

export default App;
