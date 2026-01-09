
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScoutingGame, User } from '../types';
import { dbService } from '../services/database';

interface ScoutingSchedulePageProps {
  currentUser: User;
  onBack: () => void;
}

const ScoutingSchedulePage: React.FC<ScoutingSchedulePageProps> = ({ currentUser, onBack }) => {
  const [games, setGames] = useState<ScoutingGame[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do Formulário
  const [gameTitle, setGameTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [competition, setCompetition] = useState('');

  // Estado do Filtro
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [gamesData, usersData] = await Promise.all([
        dbService.getScoutingGames(),
        dbService.getUsers()
      ]);
      setGames(gamesData);
      setAnalysts(usersData);
    } catch (err) {
      console.error("Erro ao carregar dados da agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGames = useMemo(() => {
    if (selectedAnalystId === 'all') return games;
    return games.filter(g => g.analystid === selectedAnalystId);
  }, [games, selectedAnalystId]);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle || !dateTime) {
      alert("Preencha o título do jogo e o horário.");
      return;
    }

    const newGame: ScoutingGame = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      analystid: currentUser.id,
      analystname: currentUser.name,
      gametitle: gameTitle,
      datetime: new Date(dateTime).toISOString(),
      competition,
      createdat: new Date().toISOString()
    };

    try {
      await dbService.saveScoutingGame(newGame);
      setGameTitle('');
      setDateTime('');
      setCompetition('');
      loadData();
    } catch (err: any) {
      console.error("Falha ao salvar jogo:", err);
      alert(`Erro: ${err.message || "Erro desconhecido na nuvem."}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remover este compromisso da agenda?")) {
      try {
        await dbService.deleteScoutingGame(id);
        loadData();
      } catch (err) {
        alert("Erro ao excluir jogo.");
      }
    }
  };

  const handleExport = () => {
    if (games.length === 0) return alert("Agenda vazia.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Agenda_Scouting_PVFC_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const importedData = JSON.parse(evt.target?.result as string);
        if (Array.isArray(importedData)) {
          alert("Iniciando importação para a nuvem...");
          for (const game of importedData) {
            // Garantir que os dados importados também sigam o padrão de minúsculas
            const sanitizedGame: ScoutingGame = {
              id: game.id || game.id,
              analystid: game.analystid || game.analystId,
              analystname: game.analystname || game.analystName,
              gametitle: game.gametitle || game.gameTitle,
              datetime: game.datetime || game.dateTime,
              competition: game.competition,
              createdat: game.createdat || game.createdAt || new Date().toISOString()
            };
            await dbService.saveScoutingGame(sanitizedGame);
          }
          loadData();
          alert("Importação concluída!");
        }
      } catch (err) {
        alert("Formato JSON inválido.");
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const getGameStatus = (gameDateStr: string) => {
    const gameDate = new Date(gameDateStr);
    const now = new Date();
    const diffMs = gameDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      return diffHours < -2 ? 'Finalizado' : 'Em Andamento';
    }
    return 'Próximo';
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

      {/* Header Profissional */}
      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="font-oswald text-2xl font-bold uppercase tracking-tight">Agenda <span className="text-[#006837]">Scouting</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Controle de Observação Coletiva</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={handleExport} className="h-10 px-4 rounded-xl bg-white/5 text-[9px] font-black uppercase text-slate-400 hover:text-[#f1c40f] transition-all border border-white/5 flex items-center gap-2">
               <i className="fas fa-download"></i> Backup
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="h-10 px-4 rounded-xl bg-white/5 text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all border border-white/5 flex items-center gap-2">
               <i className="fas fa-upload"></i> Importar
             </button>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-5xl w-full p-8 space-y-12">
        
        {/* Formulário de Inserção */}
        <section className="glass-panel p-8 rounded-[2rem] border border-[#006837]/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <i className="fas fa-calendar-plus text-8xl text-[#006837]"></i>
          </div>

          <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle"></i> Novo Compromisso na Agenda
          </h3>

          <form onSubmit={handleAddGame} className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
            <div className="md:col-span-5">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Partida (Ex: Inter x Grêmio)</label>
              <input required type="text" placeholder="Equipes do confronto" value={gameTitle} onChange={e => setGameTitle(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f1c40f] transition-all" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Data e Início</label>
              <input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#006837] transition-all" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Competição</label>
              <input type="text" placeholder="Ex: Libertadores" value={competition} onChange={e => setCompetition(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#006837] transition-all" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" className="w-full h-[46px] bg-[#006837] text-white rounded-xl hover:bg-[#f1c40f] hover:text-black transition-all flex items-center justify-center shadow-lg active:scale-95">
                <i className="fas fa-check"></i>
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center gap-2">
             <span className="h-1.5 w-1.5 rounded-full bg-[#006837] animate-pulse"></span>
             <p className="text-[8px] text-slate-500 uppercase font-black">Registrando como: <span className="text-white">{currentUser.name}</span></p>
          </div>
        </section>

        {/* Visualização e Filtro */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
             <div className="flex items-center gap-3">
                <div className="h-1 w-8 bg-[#006837] rounded-full"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel de Jogos</h3>
             </div>
             
             <div className="flex items-center gap-3 w-full sm:w-auto bg-white/5 p-1.5 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Visualizar Agenda:</span>
                <select 
                  value={selectedAnalystId} 
                  onChange={e => setSelectedAnalystId(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-[#f1c40f] cursor-pointer min-w-[200px]"
                >
                  <option value="all">TODOS OS ANALISTAS</option>
                  {analysts.map(u => (
                    <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-24 text-center">
                 <div className="h-10 w-10 border-2 border-[#006837] border-t-[#f1c40f] rounded-full animate-spin mx-auto"></div>
                 <p className="text-[9px] font-black text-slate-600 uppercase mt-4 tracking-widest">Sincronizando Nuvem...</p>
              </div>
            ) : filteredGames.length > 0 ? (
              filteredGames.map(game => {
                const status = getGameStatus(game.datetime);
                const isMine = game.analystid === currentUser.id;
                
                return (
                  <div key={game.id} className="group relative glass-panel p-6 rounded-3xl border border-white/5 hover:border-[#006837]/30 transition-all flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                    
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      status === 'Em Andamento' ? 'bg-red-600' : 
                      status === 'Próximo' ? 'bg-[#006837]' : 'bg-slate-800'
                    }`}></div>

                    <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[100px] shadow-inner">
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-1">{new Date(game.datetime).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className="text-2xl font-oswald font-black text-white leading-none">{new Date(game.datetime).getDate()}</span>
                      <span className="text-[8px] font-black text-[#f1c40f] uppercase mt-1 tracking-widest">{new Date(game.datetime).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>

                    <div className="flex-grow text-center md:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                         <span className="text-[10px] font-black text-[#006837] uppercase tracking-widest">{game.competition || 'Jogo Isolado'}</span>
                         <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                         <span className="text-[11px] font-bold text-slate-400">{new Date(game.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                         
                         {status === 'Em Andamento' && (
                           <span className="px-2 py-0.5 bg-red-600 text-[8px] font-black text-white uppercase rounded animate-pulse">● Ao Vivo</span>
                         )}
                      </div>
                      <h4 className="text-xl font-oswald font-bold uppercase text-white tracking-wide group-hover:text-[#f1c40f] transition-colors">{game.gametitle}</h4>
                      <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${isMine ? 'bg-[#006837] text-white' : 'bg-white/5 text-slate-500'}`}>
                           <i className="fas fa-user-ninja"></i>
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase">Analista: <span className="text-white">{game.analystname}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                       <div className="text-right hidden sm:block">
                          <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Status</p>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${
                            status === 'Em Andamento' ? 'border-red-600 text-red-500 bg-red-600/5' : 
                            status === 'Próximo' ? 'border-[#006837] text-[#006837] bg-[#006837]/5' : 
                            'border-slate-800 text-slate-600 bg-slate-800/5'
                          }`}>
                            {status}
                          </span>
                       </div>
                       
                       {isMine && (
                         <button onClick={() => handleDelete(game.id)} className="h-12 w-12 rounded-2xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20 shadow-lg">
                           <i className="fas fa-trash-alt"></i>
                         </button>
                       )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-32 text-center glass-panel rounded-[3rem] border-dashed border-white/5">
                <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-800">
                   <i className="far fa-calendar-times text-3xl"></i>
                </div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Agenda Livre no Momento</p>
                <p className="text-[9px] text-slate-700 uppercase mt-2">Nenhum jogo cadastrado para este analista</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="py-10 border-t border-white/5 text-center bg-black/40">
         <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">
           Porto Vitória FC • Departamento de Scouting • 2024
         </p>
      </footer>
    </div>
  );
};

export default ScoutingSchedulePage;
