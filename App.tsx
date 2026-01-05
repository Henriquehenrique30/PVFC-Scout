
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, FilterState, User, Recommendation, Position } from './types';
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
    maxAge: 40,
    recommendations: [],
    competitions: [],
    scoutYears: [],
  });

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
    // Mantém a ordem original (cadastro mais recente primeiro) e aplica filtros
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

  const toggleRecommendationFilter = (rec: Recommendation) => {
    setFilters(f => {
      const isSelected = f.recommendations.includes(rec);
      return {
        ...f,
        recommendations: isSelected 
          ? f.recommendations.filter(r => r !== rec)
          : [...f.recommendations, rec]
      };
    });
  };

  const togglePositionFilter = (pos: Position) => {
    setFilters(f => {
      const isSelected = f.positions.includes(pos);
      return {
        ...f,
        positions: isSelected 
          ? f.positions.filter(p => p !== pos)
          : [...f.positions, pos]
      };
    });
  };

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
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Departamento de Análise de Mercado</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 mr-4 border-r border-white/10 pr-4">
              <button onClick={exportDatabase} className="p-2 text-slate-500 hover:text-[#f1c40f] transition-colors" title="Exportar Banco de Dados">
                <i className="fas fa-file-export text-sm"></i>
              </button>
              <button onClick={() => fileImportRef.current?.click()} className="p-2 text-slate-500 hover:text-[#f1c40f] transition-colors" title="Importar Banco de Dados">
                <i className="fas fa-file-import text-sm"></i>
              </button>
              <input type="file" ref={fileImportRef} onChange={importDatabase} className="hidden" accept=".json" />
            </div>

            <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[10px] font-black text-white uppercase">{currentUser.name}</span>
               <span className="text-[8px] font-bold text-[#006837] uppercase">{currentUser.role}</span>
            </div>
            
            {currentUser.role === 'admin' && (
              <button onClick={() => setIsAdminPanelOpen(true)} className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white transition-all" title="Gerenciar Usuários">
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
            <div className="rounded-2xl bg-[#0a0f0d] p-6 border border-[#006837]/20 shadow-xl overflow-hidden">
              <h2 className="mb-6 font-oswald text-lg font-bold uppercase text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <i className="fas fa-filter text-[#f1c40f]"></i> Filtros de Busca
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase text-slate-500 tracking-widest">Pesquisar Atleta/Clube</label>
                  <div className="relative">
                    <input 
                      type="text" value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      placeholder="Nome do jogador..."
                      className="w-full rounded-xl bg-slate-900 border border-[#006837]/20 py-3 pl-10 pr-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#f1c40f]"
                    />
                    <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]"></i>
                  </div>
                </div>

                {/* FILTRO POR POSIÇÃO */}
                <div>
                  <label className="mb-3 block text-[9px] font-black uppercase text-slate-500 tracking-widest">Posições</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(Position).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => togglePositionFilter(pos)}
                        className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all border ${
                          filters.positions.includes(pos)
                            ? 'bg-[#f1c40f] border-[#f1c40f] text-slate-950'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[9px] font-black uppercase text-slate-500 tracking-widest">Qualificação (G1 a G3)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['G1 Elite', 'G2 Titular', 'G3 Monitoramento', 'Base'].map((rec) => (
                      <button
                        key={rec}
                        onClick={() => toggleRecommendationFilter(rec as Recommendation)}
                        className={`py-2.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                          filters.recommendations.includes(rec as Recommendation)
                            ? 'bg-[#006837] border-[#006837] text-white shadow-lg shadow-[#006837]/20'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {rec.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[9px] font-black uppercase text-slate-500 tracking-widest">Faixa Etária</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input 
                        type="number" value={filters.minAge} onChange={(e) => setFilters(f => ({ ...f, minAge: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs text-white outline-none text-center"
                        placeholder="Min"
                      />
                    </div>
                    <span className="text-slate-700 text-xs">a</span>
                    <div className="flex-1">
                      <input 
                        type="number" value={filters.maxAge} onChange={(e) => setFilters(f => ({ ...f, maxAge: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs text-white outline-none text-center"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase text-slate-500 tracking-widest">Competição Avaliada</label>
                  <select 
                    value={filters.competitions[0] || ''} 
                    onChange={(e) => setFilters(f => ({ ...f, competitions: e.target.value ? [e.target.value] : [] }))}
                    className="w-full rounded-xl bg-slate-900 border border-[#006837]/20 py-3 px-4 text-xs text-white outline-none focus:border-[#f1c40f]"
                  >
                    <option value="">Todas as Ligas</option>
                    {dynamicOptions.competitions.map(comp => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase text-slate-500 tracking-widest">Ano da Avaliação</label>
                  <select 
                    value={filters.scoutYears[0] || ''} 
                    onChange={(e) => setFilters(f => ({ ...f, scoutYears: e.target.value ? [parseInt(e.target.value)] : [] }))}
                    className="w-full rounded-xl bg-slate-900 border border-[#006837]/20 py-3 px-4 text-xs text-white outline-none focus:border-[#f1c40f]"
                  >
                    <option value="">Todos os Anos</option>
                    {dynamicOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => setFilters({
                    search: '',
                    positions: [],
                    minAge: 14,
                    maxAge: 40,
                    recommendations: [],
                    competitions: [],
                    scoutYears: [],
                  })}
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
                  <h3 className="font-oswald text-xl font-bold uppercase text-white tracking-wider">Atletas Encontrados</h3>
                  <span className="rounded-full bg-[#006837] px-3 py-1 text-[10px] font-black text-white">{filteredPlayers.length}</span>
               </div>
               <div className="md:hidden flex gap-2">
                 <button onClick={exportDatabase} className="p-3 rounded-xl bg-white/5 text-white"><i className="fas fa-file-export"></i></button>
                 <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="p-3 rounded-xl bg-[#006837] text-white shadow-lg">
                    <i className="fas fa-plus"></i>
                 </button>
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
                <div className="h-20 w-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                  <i className="fas fa-user-slash text-2xl text-slate-700"></i>
                </div>
                <h3 className="text-xl font-oswald font-bold text-white uppercase tracking-wider">Nenhum atleta nos critérios</h3>
                <p className="text-xs text-slate-500 mt-2 uppercase font-bold">Tente ajustar os filtros ou cadastrar um novo</p>
                <button onClick={() => { setEditingPlayer(null); setIsModalOpen(true); }} className="mt-8 px-8 py-3 bg-[#006837] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#008a4a] transition-all">Novo Cadastro Porto</button>
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Desenvolvido por <span className="text-[#f1c40f]">Henrique Bravim</span>
            </p>
            <p className="text-[8px] text-slate-700 uppercase mt-1">Sistema de Análise de Mercado</p>
          </div>
        </div>
      </footer>

      {selectedPlayer && <PlayerDetails player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {isModalOpen && <AddPlayerModal player={editingPlayer || undefined} onClose={() => setIsModalOpen(false)} onAdd={handleAddPlayer} onUpdate={handleUpdatePlayer} />}
      {isAdminPanelOpen && <AdminUserManagement users={users} onUpdateStatus={handleUpdateUserStatus} onClose={() => setIsAdminPanelOpen(false)} />}
    </div>
  );
};

export default App;
