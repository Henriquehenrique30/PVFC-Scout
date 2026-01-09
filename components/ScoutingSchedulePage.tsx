
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScoutingGame, User } from '../types';
import { dbService } from '../services/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ScoutingSchedulePageProps {
  currentUser: User;
  onBack: () => void;
}

const ScoutingSchedulePage: React.FC<ScoutingSchedulePageProps> = ({ currentUser, onBack }) => {
  const [games, setGames] = useState<ScoutingGame[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  
  const [gameTitle, setGameTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [competition, setCompetition] = useState('');

  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
    let result = [...games];

    if (selectedAnalystId !== 'all') {
      result = result.filter(g => g.analystid === selectedAnalystId);
    }

    const hasExplicitFilter = startDate !== '' || endDate !== '';

    if (hasExplicitFilter) {
      if (startDate) {
        const startLimit = new Date(startDate + 'T00:00:00').getTime();
        result = result.filter(g => new Date(g.datetime).getTime() >= startLimit);
      }
      if (endDate) {
        const endLimit = new Date(endDate + 'T23:59:59').getTime();
        result = result.filter(g => new Date(g.datetime).getTime() <= endLimit);
      }
    } else {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      result = result.filter(g => new Date(g.datetime) >= oneWeekAgo);
    }

    return result.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [games, selectedAnalystId, startDate, endDate]);

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

  const handleExportPDF = async () => {
    if (!scheduleRef.current || filteredGames.length === 0) return;
    setIsExportingPDF(true);

    try {
      const element = scheduleRef.current;
      
      // Ajuste de DPI e forçando renderização limpa
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020403',
        logging: false,
        width: element.offsetWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          const pdfHeader = clonedDoc.querySelector('#pdf-analyst-header');
          if (pdfHeader) (pdfHeader as HTMLElement).style.display = 'block';
          
          const pdfFooter = clonedDoc.querySelector('#pdf-footer');
          if (pdfFooter) (pdfFooter as HTMLElement).style.display = 'block';

          const captureArea = clonedDoc.querySelector('[ref="scheduleRef"]');
          if (captureArea) {
             const style = (captureArea as HTMLElement).style;
             style.height = 'auto';
             style.overflow = 'visible';
             style.padding = '20px';
             style.width = '100%';
             style.maxWidth = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' para Portrait (Retrato)
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Página 1
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Páginas subsequentes para evitar cortes
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      pdf.save(`Relatorio_Agenda_PVFC_${dateStr}.pdf`);
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportJSON = () => {
    if (games.length === 0) return alert("Agenda vazia.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Agenda_Backup_${new Date().toISOString().split('T')[0]}.json`);
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
          alert("Importando...");
          for (const game of importedData) {
            const sanitizedGame: ScoutingGame = {
              id: game.id,
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
          alert("Sincronizado.");
        }
      } catch (err) {
        alert("JSON inválido.");
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
    if (diffMs < 0) return diffHours < -2 ? 'Finalizado' : 'Em Andamento';
    return 'Próximo';
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="font-oswald text-2xl font-bold uppercase tracking-tight">Agenda <span className="text-[#006837]">Scouting</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Porto Vitória FC • Departamento de Mercado</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleExportPDF} 
                disabled={isExportingPDF || filteredGames.length === 0}
                className="h-10 px-6 rounded-xl bg-[#006837] text-[10px] font-black uppercase text-white hover:bg-[#f1c40f] hover:text-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
             >
               {isExportingPDF ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
               {isExportingPDF ? 'Gerando Relatório...' : 'Gerar Relatório'}
             </button>
             <button onClick={handleExportJSON} className="h-10 px-4 rounded-xl bg-white/5 text-[9px] font-black uppercase text-slate-400 hover:text-[#f1c40f] transition-all border border-white/5 flex items-center gap-2">
               <i className="fas fa-download"></i> Backup
             </button>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-5xl w-full p-8 space-y-8">
        
        <section className="glass-panel p-8 rounded-[2rem] border border-[#006837]/20 shadow-2xl relative overflow-hidden">
          <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <i className="fas fa-calendar-plus"></i> Novo Agendamento
          </h3>

          <form onSubmit={handleAddGame} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Confronto</label>
              <input required type="text" placeholder="Equipe A x Equipe B" value={gameTitle} onChange={e => setGameTitle(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f1c40f]" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Data/Hora</label>
              <input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#006837]" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 ml-1">Competição</label>
              <input type="text" placeholder="Ex: Libertadores" value={competition} onChange={e => setCompetition(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" className="w-full h-[46px] bg-[#006837] text-white rounded-xl hover:bg-[#f1c40f] hover:text-black transition-all flex items-center justify-center shadow-lg">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Analista</span>
                <select 
                  value={selectedAnalystId} 
                  onChange={e => setSelectedAnalystId(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none cursor-pointer min-w-[180px]"
                >
                  <option value="all">TODOS OS ANALISTAS</option>
                  {analysts.map(u => (
                    <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Início</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white outline-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Fim</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white outline-none" />
              </div>

              <button onClick={() => {setStartDate(''); setEndDate('');}} className="h-[38px] mt-5 px-4 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all">Limpar</button>
            </div>
          </div>

          <div ref={scheduleRef} className="flex flex-col gap-4 p-8 rounded-[2rem] bg-[#020403] min-h-[500px]">
            
            <div id="pdf-analyst-header" className="hidden mb-12 border-b border-white/10 pb-10 text-center bg-[#050807] rounded-[2.5rem] p-8">
               <div className="flex h-20 w-20 items-center justify-center mx-auto mb-6 bg-white rounded-2xl p-1 shadow-2xl">
                  <img src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" className="h-full w-full object-contain" />
               </div>
               <h2 className="text-4xl font-oswald font-bold uppercase text-white mb-4 tracking-tighter">Relatório de Agenda Semanal</h2>
               <div className="flex items-center justify-center gap-10">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Responsável pela Geração</p>
                    <p className="text-[12px] font-black text-[#f1c40f] uppercase tracking-widest">
                      {selectedAnalystId !== 'all' 
                        ? analysts.find(a => a.id === selectedAnalystId)?.name 
                        : currentUser.name}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-white/10"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Período</p>
                    <p className="text-[12px] font-black text-white uppercase tracking-widest">
                      {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString() : 'Histórico'} — {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString() : 'Atual'}
                    </p>
                  </div>
               </div>
            </div>

            {filteredGames.length > 0 ? (
              filteredGames.map(game => {
                const status = getGameStatus(game.datetime);
                const isMine = game.analystid === currentUser.id;
                const gameDate = new Date(game.datetime);
                
                return (
                  <div key={game.id} className="relative glass-panel p-6 rounded-[1.5rem] border border-white/5 flex flex-col md:flex-row items-center gap-6 overflow-hidden bg-black/40">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status === 'Em Andamento' ? 'bg-red-600' : status === 'Próximo' ? 'bg-[#006837]' : 'bg-slate-800'}`}></div>

                    <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-xl p-4 min-w-[90px]">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{gameDate.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className="text-2xl font-oswald font-black text-white">{gameDate.getDate()}</span>
                      <span className="text-[8px] font-black text-[#f1c40f] uppercase tracking-widest">{gameDate.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>

                    <div className="flex-grow text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                         <span className="text-[9px] font-black text-[#006837] uppercase tracking-widest">{game.competition || 'Competição'}</span>
                         <span className="text-[10px] text-slate-500 font-bold">{gameDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="text-xl font-oswald font-bold uppercase text-white tracking-wide">{game.gametitle}</h4>
                      <p className="text-[9px] font-black text-slate-500 uppercase mt-1">Analista: <span className="text-white">{game.analystname}</span></p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0" data-html2canvas-ignore>
                       {isMine && (
                         <button onClick={() => handleDelete(game.id)} className="h-10 w-10 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20">
                           <i className="fas fa-trash-alt text-sm"></i>
                         </button>
                       )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Agenda Vazia</p>
              </div>
            )}
            
            <div id="pdf-footer" className="hidden mt-12 border-t border-white/5 pt-8 text-center">
               <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                 Porto Vitória FC • Departamento de Análise de Mercado
               </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ScoutingSchedulePage;
