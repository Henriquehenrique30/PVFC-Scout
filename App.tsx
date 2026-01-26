
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
import ExternalScoutingPage from './components/ExternalScoutingPage';
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

  const [view, setView] = useState<'dashboard' | 'watchlist' | 'schedule' | 'external'>('dashboard');

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

  useEffect(() => {
    if (!currentUser || !supabase) return;
    const checkNotifications = async () => {
      const items = await dbService.getWatchlist();
      const count = items.filter(i => i.assigned_analyst_id === currentUser.id && i.status === 'pending').length;
      setNotificationsCount(count);
    };
    checkNotifications();
    const channel = supabase.channel('watchlist_notifs').on('postgres_changes', { event: '*', table: 'watchlist', schema: 'public' }, () => checkNotifications()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const loadData = async (isAutoRefresh = false) => {
    if (isAutoRefresh && (isModalOpen || isAdminPanelOpen || selectedPlayer || isShadowTeamOpen || isComparisonOpen || view !== 'dashboard')) return;
    if (!isCloudActive()) return;
    if (!isAutoRefresh) setLoading(true);
    try {
      const [allPlayers, allUsers] = await Promise.all([dbService.getPlayers(), dbService.getUsers()]);
      setPlayers(allPlayers);
      setUsers(allUsers);
    } catch (err) { console.error(err); } finally { if (!isAutoRefresh) setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 45000);
    return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(SESSION_KEY);
  }, [currentUser]);

  const processedPlayers = useMemo(() => {
    return players.map(p => {
      if (!p.birthDate) return p;
      const today = new Date();
      const birth = new Date(p.birthDate);
      if (isNaN(birth.getTime())) return p;
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return { ...p, age };
    });
  }, [players]);

  const allCompetitions = useMemo(() => {
    const set = new Set(processedPlayers.map(p => p.competition).filter(Boolean));
    return Array.from(set).sort();
  }, [processedPlayers]);

  const filteredPlayers = useMemo(() => {
    return processedPlayers.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || p.club.toLowerCase().includes(filters.search.toLowerCase());
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
      return { ...prev, [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
    });
  };

  const handleUpdateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'rejected') {
        await dbService.deleteUser(userId);
      } else {
        const user = users.find(u => u.id === userId);
        if (user) {
          await dbService.saveUser({ ...user, status: 'approved' });
        }
      }
      loadData();
    } catch (err) {
      alert("Erro ao atualizar status do usuário.");
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      await dbService.saveUser(user);
      loadData();
    } catch (err) {
      alert("Erro ao atualizar usuário.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Deseja excluir este acesso permanentemente do sistema?")) {
      try {
        await dbService.deleteUser(userId);
        loadData();
      } catch (err) {
        alert("Erro ao excluir usuário.");
      }
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleDeletePlayer = async (id: string) => {
    // Restrição de Segurança: Somente Admins podem excluir
    if (currentUser?.role !== 'admin') {
      alert("Acesso Negado: Somente usuários administradores podem excluir cards de jogadores. Entre em contato com o administrador do sistema para solicitar esta ação.");
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir este atleta permanentemente do banco de dados?")) {
      try {
        await dbService.deletePlayer(id);
        loadData();
      } catch (err) {
        alert("Erro ao excluir atleta.");
      }
    }
  };

  if (!currentUser) return <Auth onLogin={setCurrentUser} users={users} onRegister={(u) => dbService.saveUser(u).then(() => loadData())} />;
  if (view === 'watchlist') return <WatchlistPage onBack={() => setView('dashboard')} />;
  if (view === 'schedule') return <ScoutingSchedulePage currentUser={currentUser} onBack={() => setView('dashboard')} />;
  if (view === 'external') return <ExternalScoutingPage onBack={() => setView('dashboard')} />;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 glass-panel py-3 shadow-2xl">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white rounded-xl p-1.5 shadow-xl border border-white/20 transform hover:scale-110 transition-transform">
               <img src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" className="h-full w-full object-contain" alt="PVFC Logo" />
            </div>
            <div>
              <h1 className="font-oswald text-xl font-bold uppercase tracking-tighter text-white leading-none">PORTO VITÓRIA <span className="text-[#f1c40f]">FC</span></h1>
              <p className="text-[7px] font-black text-[#006837] uppercase tracking-[0.4em] mt-0.5">Análise de Mercado</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end mr-2">
               <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Acesso</span>
               <span className="text-[9px] font-bold text-white uppercase leading-none">{currentUser.name}</span>
            </div>
            
            <button 
              onClick={() => setView('external')} 
              className="px-3 py-2 rounded-lg bg-[#f1c40f]/20 border border-[#f1c40f]/50 text-[9px] font-black uppercase text-[#f1c40f] hover:bg-[#f1c40f] hover:text-black transition-all shadow-lg whitespace-nowrap"
            >
              <i className="fas fa-map-marked-alt mr-1"></i> Captação Ext.
            </button>

            <button 
              onClick={() => setView('schedule')} 
              className="px-3 py-2 rounded-lg bg-blue-600/15 border border-blue-500/50 text-[9px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg whitespace-nowrap"
            >
              <i className="fas fa-calendar-alt mr-1"></i> Agenda
            </button>
            <button 
              onClick={() => setView('watchlist')} 
              className={`relative px-3 py-2 rounded-lg border text-[9px] font-black uppercase transition-all flex items-center gap-1.5 shadow-lg whitespace-nowrap ${
                notificationsCount > 0 
                ? 'bg-amber-500 text-black border-amber-600 animate-pulse' 
                : 'bg-indigo-600/15 border-indigo-500/50 text-indigo-400 hover:bg-indigo-600 hover:text-white shadow-indigo-900/20'
              }`}
            >
              <i className="fas fa-binoculars"></i> Radar
              {notificationsCount > 0 && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-600 rounded-full border-2 border-black"></span>}
            </button>
            <button onClick={() => setIsComparisonOpen(true)} className="px-3 py-2 rounded-lg bg-slate-900 border border-white/5 text-[9px] font-black uppercase text-slate-300 hover:text-white transition-all whitespace-nowrap"><i className="fas fa-database mr-1"></i> Data Lab</button>
            <button onClick={() => setIsShadowTeamOpen(true)} className="px-3 py-2 rounded-lg bg-[#006837]/20 border border-[#006837]/40 text-[9px] font-black uppercase text-[#006837] hover:bg-[#006837] hover:text-white transition-all whitespace-nowrap"><i className="fas fa-chess-board mr-1"></i> Shadow Team</button>
            
            {currentUser.role === 'admin' && (
              <button onClick={() => setIsAdminPanelOpen(true)} className="px-3 py-2 rounded-lg bg-violet-600/20 border border-violet-500/40 text-[9px] font-black uppercase text-violet-400 hover:bg-violet-600 hover:text-white transition-all whitespace-nowrap">
                <i className="fas fa-users-cog mr-1"></i> Admin
              </button>
            )}

            <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="px-4 py-2 rounded-lg bg-[#006837] text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#006837]/30 whitespace-nowrap">Adicionar Atleta</button>
            <button onClick={() => setCurrentUser(null)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-power-off text-sm"></i></button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow mx-auto max-w-[1600px] px-10 py-10 w-full flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-28 glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
               <i className="fas fa-sliders-h text-[#006837]"></i>
               <h3 className="text-[12px] font-black text-white uppercase tracking-widest">Parâmetros</h3>
            </div>
            
            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Nome ou Clube</label>
              <input 
                type="text" 
                value={filters.search} 
                onChange={e => setFilters({...filters, search: e.target.value})} 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#f1c40f] outline-none transition-all placeholder-slate-700" 
                placeholder="Pesquisar..." 
              />
            </section>

            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Idade (Mín - Máx)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0" max="100"
                  value={filters.minAge} 
                  onChange={e => setFilters({...filters, minAge: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f1c40f]" 
                />
                <span className="text-slate-600">-</span>
                <input 
                  type="number" 
                  min="0" max="100"
                  value={filters.maxAge} 
                  onChange={e => setFilters({...filters, maxAge: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f1c40f]" 
                />
              </div>
            </section>

            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Posição</label>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.values(Position).map(pos => (
                  <button 
                    key={pos} 
                    onClick={() => toggleFilter('positions', pos)} 
                    className={`py-2 rounded-lg text-[10px] font-black transition-all ${filters.positions.includes(pos) ? 'bg-[#f1c40f] text-black shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </section>

            {/* PERNA DOMINANTE (MULTI-SELECT DROPDOWN) */}
            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Perna Dominante</label>
              <div className="space-y-3">
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !filters.feet.includes(val as any)) {
                      toggleFilter('feet', val);
                    }
                    e.target.value = "";
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#006837]"
                >
                  <option value="">Adicionar pé...</option>
                  <option value="Right">DESTRO</option>
                  <option value="Left">CANHOTO</option>
                  <option value="Both">AMBIDESTRO</option>
                </select>
                <div className="flex flex-wrap gap-2">
                  {filters.feet.map(f => (
                    <span key={f} className="flex items-center gap-2 bg-[#006837]/20 border border-[#006837]/40 text-[#006837] px-2 py-1 rounded text-[10px] font-black uppercase">
                      {f === 'Right' ? 'DESTRO' : f === 'Left' ? 'CANHOTO' : 'AMB.'}
                      <button onClick={() => toggleFilter('feet', f)} className="hover:text-white">
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* COMPETIÇÕES (MULTI-SELECT DROPDOWN) */}
            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Competições</label>
              <div className="space-y-3">
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !filters.competitions.includes(val)) {
                      toggleFilter('competitions', val);
                    }
                    e.target.value = "";
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#f1c40f]"
                >
                  <option value="">Adicionar competição...</option>
                  {allCompetitions.map(comp => (
                    <option key={comp} value={comp}>{comp.toUpperCase()}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {filters.competitions.map(comp => (
                    <span key={comp} className="flex items-center gap-2 bg-[#f1c40f]/20 border border-[#f1c40f]/40 text-[#f1c40f] px-2 py-1 rounded text-[9px] font-black uppercase">
                      {comp}
                      <button onClick={() => toggleFilter('competitions', comp)} className="hover:text-white">
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <button onClick={() => setFilters({search: '', positions: [], minAge: 0, maxAge: 50, recommendations: [], competitions: [], scoutYears: [], feet: []})} className="w-full py-3 text-[10px] font-black text-slate-600 uppercase hover:text-[#f1c40f] transition-colors tracking-widest border-t border-white/5 pt-6">Limpar Filtros</button>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center opacity-30">
               <div className="h-10 w-10 border-2 border-[#006837] border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-[10px] font-black uppercase tracking-widest">Acessando Cloud PVFC...</p>
            </div>
          ) : (
            <>
              {filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredPlayers.map(p => (
                    <PlayerCard 
                      key={p.id} 
                      player={p} 
                      onClick={setSelectedPlayer} 
                      onEdit={handleEditPlayer} 
                      onDelete={handleDeletePlayer} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                   <i className="fas fa-search text-5xl mb-6"></i>
                   <p className="text-sm font-black uppercase tracking-widest">Nenhum atleta encontrado com estes filtros</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {isAdminPanelOpen && (
        <AdminUserManagement 
          users={users} 
          players={players} 
          onUpdateStatus={handleUpdateUserStatus} 
          onUpdateUser={handleUpdateUser} 
          onDeleteUser={handleDeleteUser}
          onClose={() => setIsAdminPanelOpen(false)} 
        />
      )}

      {isShadowTeamOpen && currentUser && <ShadowTeamModal players={processedPlayers} currentUser={currentUser} onClose={() => setIsShadowTeamOpen(false)} />}
      {isComparisonOpen && <ComparisonModal onClose={() => setIsComparisonOpen(false)} />}
      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && (
        <AddPlayerModal 
          currentUser={currentUser!}
          player={editingPlayer || undefined} 
          onClose={() => { setIsModalOpen(false); setEditingPlayer(null); }} 
          onAdd={(p) => dbService.savePlayer(p).then(() => loadData())} 
          onUpdate={(p) => dbService.savePlayer(p).then(() => loadData())} 
        />
      )}
    </div>
  );
};

export default App;
