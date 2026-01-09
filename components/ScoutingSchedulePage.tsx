
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScoutingGame, User } from '../types';
import { dbService } from '../services/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Helper function to determine the status of a scouting game based on its date and time.
 */
const getGameStatus = (dateTimeStr: string): string => {
  const gameDate = new Date(dateTimeStr);
  const now = new Date();
  const diffHours = (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0 && diffHours > -3) {
    return 'Em Andamento';
  } else if (diffHours <= 0) {
    return 'Finalizado';
  } else if (diffHours < 48) {
    return 'Próximo';
  }
  return 'Agendado';
};

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
      // Padrão: Próximos 30 dias se não houver filtro
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      result = result.filter(g => new Date(g.datetime) >= now);
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
      
      // html2canvas capture com ajuste de escala e fundo sólido para evitar transparência que causa cortes visuais
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020403', // Fundo preto puro para o relatório
        logging: false,
        onclone: (clonedDoc) => {
          // Mostrar elementos exclusivos do PDF
          const pdfHeader = clonedDoc.querySelector('#pdf-analyst-header');
          if (pdfHeader) (pdfHeader as HTMLElement).style.display = 'block';
          
          const pdfFooter = clonedDoc.querySelector('#pdf-footer');
          if (pdfFooter) (pdfFooter as HTMLElement).style.display = 'block';

          // Forçar o container a não ter scroll e expandir totalmente
          const captureArea = clonedDoc.querySelector('.schedule-container-capture');
          if (captureArea) {
             const style = (captureArea as HTMLElement).style;
             style.height = 'auto';
             style.overflow = 'visible';
             style.padding = '40px';
             style.width = '210mm'; // Largura fixa A4
             style.maxWidth = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcula altura proporcional da imagem no PDF
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Adiciona a primeira página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Loop para múltiplas páginas, evitando a página branca final com margem de segurança (10mm)
      while (heightLeft > 10) { 
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      pdf.save(`Relatorio_Agenda_PVFC_${dateStr}.pdf`);
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const currentGeneratingAnalyst = useMemo(() => {
    if (selectedAnalystId !== 'all') {
      const found = analysts.find(a => a.id === selectedAnalystId);
      return found ? found.name : "Analista Geral";
    }
    return currentUser.name;
  }, [selectedAnalystId, analysts, currentUser]);

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col animate-in fade-in duration-500">
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
               {isExportingPDF ? 'Sincronizando...' : 'Gerar Relatório'}
             </button>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-5xl w-full p-8 space-y-8">
        
        {/* Adicionar Jogo */}
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

        {/* Filtros */}
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

          {/* Área de Captura do Relatório */}
          <div ref={scheduleRef} className="schedule-container-capture flex flex-col gap-5 p-4 md:p-8 rounded-[2rem] bg-[#020403] min-h-[400px]">
            
            {/* Cabeçalho Exclusivo PDF */}
            <div id="pdf-analyst-header" className="hidden mb-12 border-b-2 border-[#006837]/30 pb-10 text-center bg-[#050807] rounded-[2.5rem] p-10">
               <div className="flex h-24 w-24 items-center justify-center mx-auto mb-6 bg-white rounded-[1.5rem] p-2 shadow-2xl">
                  <img src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" className="h-full w-full object-contain" />
               </div>
               <h2 className="text-5xl font-oswald font-bold uppercase text-white mb-6 tracking-tighter">Relatório de Escala de Scouting</h2>
               <div className="flex items-center justify-center gap-12">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Analista Responsável</p>
                    <p className="text-[16px] font-black text-[#f1c40f] uppercase tracking-widest">
                      {currentGeneratingAnalyst}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-[#006837]/20"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Período de Análise</p>
                    <p className="text-[16px] font-black text-white uppercase tracking-widest">
                      {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString() : '—'} ATÉ {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString() : 'ATUAL'}
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
                  <div key={game.id} className="relative glass-panel p-6 rounded-[1.5rem] border border-white/5 flex flex-col md:flex-row items-center gap-8 overflow-hidden bg-black/50 transition-all hover:border-[#006837]/30">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status === 'Em Andamento' ? 'bg-red-600' : status === 'Próximo' ? 'bg-[#006837]' : 'bg-slate-800'}`}></div>

                    <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[100px] shadow-inner">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{gameDate.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className="text-3xl font-oswald font-black text-white leading-tight">{gameDate.getDate()}</span>
                      <span className="text-[9px] font-black text-[#f1c40f] uppercase tracking-widest">{gameDate.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>

                    <div className="flex-grow text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                         <span className="px-2 py-0.5 rounded bg-[#006837]/20 text-[#006837] text-[10px] font-black uppercase tracking-widest border border-[#006837]/30">
                           {game.competition || 'Monitoramento'}
                         </span>
                         <span className="text-xs text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                           <i className="far fa-clock mr-1.5"></i>
                           {gameDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <h4 className="text-2xl font-oswald font-bold uppercase text-white tracking-wide mb-2">{game.gametitle}</h4>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                         <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-slate-500">
                           <i className="fas fa-user-tie"></i>
                         </div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           Analista Escalado: <span className="text-white ml-1">{game.analystname}</span>
                         </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0" data-html2canvas-ignore>
                       {isMine && (
                         <button onClick={() => handleDelete(game.id)} className="h-11 w-11 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20 shadow-lg">
                           <i className="fas fa-trash-alt text-base"></i>
                         </button>
                       )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-40">
                <i className="far fa-calendar-times text-5xl mb-4 text-slate-800"></i>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Nenhum compromisso registrado</p>
              </div>
            )}
            
            {/* Rodapé Exclusivo PDF */}
            <div id="pdf-footer" className="hidden mt-16 border-t border-white/10 pt-10 text-center">
               <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">
                 Documento Oficial • Porto Vitória FC • Analítica de Mercado
               </p>
               <p className="text-[8px] font-bold text-slate-800 uppercase mt-4">
                 © {new Date().getFullYear()} Porto Vitória - Todos os direitos reservados.
               </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ScoutingSchedulePage;
