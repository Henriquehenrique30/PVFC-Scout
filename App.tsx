
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

  // Lista dinâmica de competições para o dropdown
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

  const handleCompetitionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters(prev => ({
      ...prev,
      competitions: val === 'all' ? [] : [val]
    }));
  };

  const handleFootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters(prev => ({
      ...prev,
      feet: val === 'all' ? [] : [val as any]
    }));
  };

  if (!currentUser) return <Auth onLogin={setCurrentUser} users={users} onRegister={(u) => dbService.saveUser(u).then(() => loadData())} />;
  if (view === 'watchlist') return <WatchlistPage onBack={() => setView('dashboard')} />;
  if (view === 'schedule') return <ScoutingSchedulePage currentUser={currentUser} onBack={() => setView('dashboard')} />;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 glass-panel py-4 shadow-2xl">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-10">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-white rounded-2xl p-2 shadow-xl border border-white/20 transform hover:scale-110 transition-transform">
               <img src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-oswald text-2xl font-bold uppercase tracking-tighter text-white">PORTO VITÓRIA <span className="text-[#f1c40f]">FC</span></h1>
              <p className="text-[9px] font-black text-[#006837] uppercase tracking-[0.4em] mt-1">Intelligence Scouting Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setView('schedule')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:text-[#f1c40f] transition-all"><i className="fas fa-calendar-alt mr-2"></i> Agenda</button>
            <button onClick={() => setView('watchlist')} className={`relative px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center gap-2 ${notificationsCount > 0 ? 'bg-[#f1c40f] text-black border-[#f1c40f] animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'}`}>
              <i className="fas fa-binoculars"></i> Radar
              {notificationsCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full border-2 border-black"></span>}
            </button>
            <button onClick={() => setIsComparisonOpen(true)} className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] font-black uppercase text-slate-300 hover:text-white transition-all"><i className="fas fa-database mr-2"></i> Data Lab</button>
            <button onClick={() => setIsShadowTeamOpen(true)} className="px-4 py-2 rounded-xl bg-[#006837]/20 border border-[#006837]/40 text-[10px] font-black uppercase text-[#006837] hover:bg-[#006837] hover:text-white transition-all"><i className="fas fa-chess-board mr-2"></i> Shadow Team</button>
            <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="px-6 py-2 rounded-xl bg-[#006837] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#006837]/30">Adicionar Atleta</button>
            <button onClick={() => setCurrentUser(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-power-off"></i></button>
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
            
            {/* PESQUISA */}
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

            {/* RANGE DE IDADE */}
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

            {/* POSIÇÃO */}
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

            {/* PERNA DOMINANTE (DROPDOWN) */}
            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Perna Dominante</label>
              <select 
                onChange={handleFootChange}
                value={filters.feet.length > 0 ? filters.feet[0] : 'all'}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#f1c40f] outline-none appearance-none cursor-pointer"
              >
                <option value="all">TODAS</option>
                <option value="Right">DESTRO</option>
                <option value="Left">CANHOTO</option>
                <option value="Both">AMBIDESTRO</option>
              </select>
            </section>

            {/* COMPETIÇÃO (DROPDOWN) */}
            <section>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Competição</label>
              <select 
                onChange={handleCompetitionChange}
                value={filters.competitions.length > 0 ? filters.competitions[0] : 'all'}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#f1c40f] outline-none appearance-none cursor-pointer"
              >
                <option value="all">TODAS AS COMPETIÇÕES</option>
                {allCompetitions.map(comp => (
                  <option key={comp} value={comp}>{comp.toUpperCase()}</option>
                ))}
              </select>
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
                    <PlayerCard key={p.id} player={p} onClick={setSelectedPlayer} />
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

      {isShadowTeamOpen && currentUser && <ShadowTeamModal players={processedPlayers} currentUser={currentUser} onClose={() => setIsShadowTeamOpen(false)} />}
      {isComparisonOpen && <ComparisonModal onClose={() => setIsComparisonOpen(false)} />}
      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && <AddPlayerModal player={editingPlayer || undefined} onClose={() => setIsModalOpen(false)} onAdd={(p) => dbService.savePlayer(p).then(() => loadData())} onUpdate={(p) => dbService.savePlayer(p).then(() => loadData())} />}
    </div>
  );
};

export default App;
