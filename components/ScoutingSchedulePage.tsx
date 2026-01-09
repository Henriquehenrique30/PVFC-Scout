
import React, { useState, useEffect, useMemo } from 'react';
import { ScoutingGame, User } from '../types';
import { dbService } from '../services/database';

interface ScoutingSchedulePageProps {
  currentUser: User;
  onBack: () => void;
}

const ScoutingSchedulePage: React.FC<ScoutingSchedulePageProps> = ({ currentUser, onBack }) => {
  const [games, setGames] = useState<ScoutingGame[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Formulário
  const [gameTitle, setGameTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [competition, setCompetition] = useState('');

  // Estado do Filtro
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('all');

  const loadGames = async () => {
    setLoading(true);
    const data = await dbService.getScoutingGames();
    setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    loadGames();
  }, []);

  const analystsList = useMemo(() => {
    const names = games.map(g => g.analystName);
    return Array.from(new Set(names)).sort();
  }, [games]);

  const filteredGames = useMemo(() => {
    if (selectedAnalyst === 'all') return games;
    return games.filter(g => g.analystName === selectedAnalyst);
  }, [games, selectedAnalyst]);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle || !dateTime) return;

    const newGame: ScoutingGame = {
      id: `game_${Date.now()}`,
      analystId: currentUser.id,
      analystName: currentUser.name,
      gameTitle,
      dateTime,
      competition,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveScoutingGame(newGame);
      setGameTitle('');
      setDateTime('');
      setCompetition('');
      loadGames();
    } catch (err) {
      alert("Erro ao salvar na nuvem.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remover este compromisso da agenda?")) {
      await dbService.deleteScoutingGame(id);
      loadGames();
    }
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="font-oswald text-2xl font-bold uppercase tracking-tight">Agenda <span className="text-[#006837]">Scouting</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Compromissos do Departamento • Integrado Cloud</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
             <i className="fas fa-calendar-alt text-[#f1c40f]"></i>
             <span className="text-[10px] font-black text-white uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-5xl w-full p-8 space-y-12">
        
        {/* Formulário de Cadastro */}
        <section className="glass-panel p-8 rounded-[2rem] border border-[#006837]/20 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-[#006837]/10 rounded-full blur-3xl"></div>
          
          <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle"></i> Agendar Novo Jogo
          </h3>

          <form onSubmit={handleAddGame} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Partida (Equipe A x Equipe B)</label>
              <input required type="text" placeholder="Ex: Flamengo x Palmeiras" value={gameTitle} onChange={e => setGameTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f1c40f] transition-all" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Data e Horário</label>
              <input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006837] transition-all" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 ml-1">Competição</label>
              <input type="text" placeholder="Ex: Brasileirão U20" value={competition} onChange={e => setCompetition(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006837] transition-all" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" className="w-full h-[46px] bg-[#006837] text-white rounded-xl hover:bg-[#f1c40f] hover:text-black transition-all flex items-center justify-center shadow-lg">
                <i className="fas fa-check"></i>
              </button>
            </div>
          </form>
          <p className="mt-4 text-[8px] text-slate-500 uppercase italic">Este jogo será vinculado automaticamente ao analista: <span className="text-white font-black">{currentUser.name}</span></p>
        </section>

        {/* Agenda e Filtros */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <i className="fas fa-clock text-[#006837]"></i> Cronograma de Observação
             </h3>
             
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">Filtrar Analista:</span>
                <select 
                  value={selectedAnalyst} 
                  onChange={e => setSelectedAnalyst(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-[#f1c40f] w-full sm:w-48 cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">TODOS OS ANALISTAS</option>
                  {analystsList.map(name => (
                    <option key={name} value={name} className="bg-slate-900">{name.toUpperCase()}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-20 text-center"><div className="h-8 w-8 border-2 border-[#f1c40f] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
            ) : filteredGames.length > 0 ? (
              filteredGames.map(game => (
                <div key={game.id} className="group relative glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#006837]/40 transition-all flex flex-col md:flex-row items-center gap-6 overflow-hidden">
                  
                  {/* Data Badge */}
                  <div className="flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-xl px-4 py-2 min-w-[80px]">
                    <span className="text-[#f1c40f] text-lg font-black leading-none">{new Date(game.dateTime).getDate()}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase">{new Date(game.dateTime).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>

                  <div className="flex-grow text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                      <span className="text-[9px] font-black text-[#006837] uppercase tracking-widest">{game.competition || 'Jogo Amistoso'}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                      {/* Fix: use '2-digit' instead of '2-numeric' */}
                      <span className="text-[10px] font-bold text-slate-500">{new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h4 className="text-lg font-oswald font-bold uppercase text-white tracking-wide">{game.gameTitle}</h4>
                    <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-[#f1c40f]/10 flex items-center justify-center text-[#f1c40f] text-[10px]">
                        <i className="fas fa-user-ninja"></i>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase">Agenda de: <span className="text-white">{game.analystName}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                     {game.analystId === currentUser.id && (
                       <button onClick={() => handleDelete(game.id)} className="h-10 w-10 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20">
                         <i className="fas fa-trash-alt text-xs"></i>
                       </button>
                     )}
                     <div className="h-10 px-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        {new Date(game.dateTime) > new Date() ? 'Pendente' : 'Finalizado'}
                     </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center glass-panel rounded-[2rem] border-dashed border-white/5 opacity-40">
                <i className="far fa-calendar-times text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum jogo agendado para este filtro</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="py-8 border-t border-white/5 text-center">
         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
           © Porto Vitória FC • Gestão de Agenda Coletiva
         </p>
      </footer>
    </div>
  );
};

export default ScoutingSchedulePage;
