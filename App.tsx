
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, FilterState, User } from './types';
import PlayerCard from './components/PlayerCard';
import PlayerDetails from './components/PlayerDetails';
import AddPlayerModal from './components/AddPlayerModal';
import Auth from './components/Auth';
import AdminUserManagement from './components/AdminUserManagement';

const App: React.FC = () => {
  const STORAGE_KEY = 'porto_vitoria_database_v2';
  const USERS_KEY = 'porto_vitoria_users_v2';
  const SESSION_KEY = 'porto_vitoria_session_v2';
  const fileImportRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    positions: [],
    minAge: 14,
    maxAge: 45,
    recommendations: [],
    competitions: [],
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);
  const handleRegister = (newUser: User) => setUsers(prev => [...prev, newUser]);
  
  const handleUpdateUserStatus = (userId: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const exportDatabase = () => {
    const dataStr = JSON.stringify(players, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `PORTO_VITORIA_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedPlayers = JSON.parse(content);
          if (Array.isArray(importedPlayers)) {
            if (window.confirm(`Importar ${importedPlayers.length} atletas?`)) {
              setPlayers(importedPlayers);
            }
          }
        } catch (err) {
          alert("Erro no arquivo.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAddPlayer = (newPlayer: Player) => setPlayers(prev => [newPlayer, ...prev]);
  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handleDeletePlayer = (id: string) => {
    if(window.confirm("Apagar permanentemente este atleta?")) {
      setPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          p.club.toLowerCase().includes(filters.search.toLowerCase());
      const matchPos = filters.positions.length === 0 || filters.positions.includes(p.position1) || (p.position2 && filters.positions.includes(p.position2));
      const matchAge = p.age >= filters.minAge && p.age <= filters.maxAge;
      const matchRec = filters.recommendations.length === 0 || filters.recommendations.includes(p.recommendation);
      return matchSearch && matchPos && matchAge && matchRec;
    });
  }, [filters, players]);

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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Portal Oficial Scout</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[10px] font-black text-white uppercase">{currentUser.name}</span>
               <span className="text-[8px] font-bold text-[#006837] uppercase">{currentUser.role}</span>
            </div>
            
            {currentUser.role === 'admin' && (
              <button onClick={() => setIsAdminPanelOpen(true)} className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all">
                <i className="fas fa-users-cog text-xs"></i>
              </button>
            )}
            
            <button onClick={handleLogout} className="p-2.5 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all">
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
                <i className="fas fa-filter text-[#f1c40f]"></i> Filtros
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase text-slate-500">Busca</label>
                  <input 
                    type="text" value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-[#006837]/20 py-3 px-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#f1c40f]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#0a0f0d] to-[#006837]/10 p-6 border border-[#f1c40f]/20 shadow-xl">
               <h3 className="text-[10px] font-black text-[#f1c40f] uppercase tracking-widest mb-4">Dados e Backup</h3>
               <div className="grid grid-cols-1 gap-2">
                  <button onClick={exportDatabase} className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/5 border border-white/10 py-2.5 text-[9px] font-black text-white hover:bg-white hover:text-black transition-all">
                    <i className="fas fa-download"></i> Exportar JSON
                  </button>
                  <button onClick={() => fileImportRef.current?.click()} className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/5 border border-white/10 py-2.5 text-[9px] font-black text-white hover:bg-white hover:text-black transition-all">
                    <i className="fas fa-upload"></i> Importar JSON
                  </button>
                  <input type="file" ref={fileImportRef} onChange={importDatabase} className="hidden" accept=".json" />
               </div>
            </div>
          </aside>

          <div className="flex-1">
            {filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredPlayers.map(player => (
                  <div key={player.id} className="group relative">
                    <PlayerCard player={player} onClick={setSelectedPlayer} />
                    <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); setIsModalOpen(true); }} className="h-8 w-8 bg-[#f1c40f] text-black rounded-lg flex items-center justify-center shadow-lg"><i className="fas fa-pen text-[10px]"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePlayer(player.id); }} className="h-8 w-8 bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg"><i className="fas fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 border border-dashed border-[#006837]/30 rounded-[3rem] bg-[#0a0f0d]/50">
                <i className="fas fa-users text-4xl text-[#006837] mb-6 opacity-20"></i>
                <h3 className="text-xl font-oswald font-bold text-white uppercase">Sem Resultados</h3>
                <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="mt-8 px-8 py-3 bg-[#006837] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#008a4a] transition-all">Cadastrar Atleta</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && <AddPlayerModal player={editingPlayer || undefined} onClose={() => setIsModalOpen(false)} onAdd={handleAddPlayer} onUpdate={handleUpdatePlayer} />}
      {isAdminPanelOpen && <AdminUserManagement users={users} onUpdateStatus={handleUpdateUserStatus} onClose={() => setIsAdminPanelOpen(false)} />}
    </div>
  );
};

export default App;
