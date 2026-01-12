
import React, { useEffect, useState, useRef } from 'react';
import { Player } from '../types';
import { getScoutReport } from '../services/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, onClose }) => {
  const [report, setReport] = useState<string>('Decodificando métricas de performance...');
  const [loading, setLoading] = useState(true);
  const [isKeyMissing, setIsKeyMissing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const hasData = !!player.aiContextData;

  const fetchReport = async () => {
    setLoading(true);
    setIsKeyMissing(false);
    try {
      const res = await getScoutReport(player);
      setReport(res);
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING' || err.message?.includes('API_KEY')) {
        setIsKeyMissing(true);
        setReport("CONFIGURAÇÃO NECESSÁRIA: Selecione sua chave de API no painel superior.");
      } else {
        setReport("Erro ao carregar análise técnica. Verifique sua conexão ou chave.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [player]);

  const handleOpenConfig = async () => {
    if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      fetchReport();
    }
  };

  const handleExportPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050807',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dossie_${player.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao exportar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderReportText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-[#f1c40f] font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const footLabel = player.foot === 'Right' ? 'Destro' : player.foot === 'Left' ? 'Canhoto' : 'Ambid.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-hidden">
      <div 
        ref={reportContainerRef} 
        className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#050807] shadow-2xl border border-white/5 h-[85vh] flex flex-col md:flex-row animate-in fade-in zoom-in duration-500"
      >
        
        <button 
          onClick={onClose}
          data-html2canvas-ignore
          className="absolute right-6 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-white hover:bg-red-600 transition-all border border-white/10"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* SIDEBAR ESQUERDA (DADOS CADASTRAIS) */}
        <div className="md:w-[35%] lg:w-[30%] p-8 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center shrink-0 h-full">
          
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#006837] to-[#f1c40f] rounded-[1.8rem] blur-sm opacity-10"></div>
            <img 
              src={player.photoUrl} 
              alt={player.name} 
              className="relative h-40 w-40 rounded-[2rem] object-cover object-top border-2 border-white/5 shadow-xl"
              crossOrigin="anonymous"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-4 py-1.5 rounded-full text-[9px] font-black text-slate-950 uppercase shadow-xl tracking-tighter text-center min-w-[120px]">
              {player.recommendation}
            </div>
          </div>
          
          <div className="mt-8 text-center shrink-0 w-full">
            <h2 className="font-oswald text-3xl font-bold uppercase text-white leading-tight">{player.name}</h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-[11px] font-black text-[#006837] uppercase bg-[#006837]/10 px-2 py-0.5 rounded">{player.position1}</span>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{player.club}</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 w-full shrink-0">
            {[
              { label: 'IDADE', val: player.age },
              { label: 'ALTURA', val: `${player.height}cm` },
              { label: 'PÉ', val: footLabel },
              { label: 'JOGOS', val: player.gamesWatched },
              { label: 'TEMP.', val: player.scoutYear },
              { label: 'LIGA', val: player.competition || 'N/A' }
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl bg-white/5 p-3 border border-white/5 text-center">
                <div className="text-[8px] text-slate-600 uppercase font-black mb-1 tracking-widest">{item.label}</div>
                <div className="text-sm font-bold text-white leading-none">{item.val}</div>
              </div>
            ))}
          </div>

          {(player.agent || player.contact) && (
            <div className="mt-8 w-full rounded-2xl bg-[#0f1a16] p-5 border border-[#006837]/20 shrink-0">
              <h4 className="text-[8px] font-black text-[#006837] uppercase tracking-widest mb-3 flex items-center gap-2">
                 <i className="fas fa-user-tie"></i> Contato / Agente
              </h4>
              <div className="space-y-2">
                {player.agent && (
                  <div>
                    <span className="text-slate-500 font-black text-[8px] uppercase block">Representante</span>
                    <p className="text-[11px] font-bold text-white">{player.agent}</p>
                  </div>
                )}
                {player.contact && (
                  <div className="text-[11px] font-bold text-[#f1c40f] flex items-center gap-2">
                    <i className="fab fa-whatsapp text-[#006837]"></i>
                    {player.contact}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO DIREITA (RELATÓRIO IA) */}
        <div className="flex-1 flex flex-col h-full bg-[#050807] overflow-hidden border-l border-white/5">
          
          <div className="p-8 pb-4 border-b border-white/5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] border border-[#006837]/20">
                  <i className="fas fa-brain text-xl"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white">Análise de Performance</h3>
                  <p className="text-[9px] font-black text-[#006837] uppercase tracking-[0.3em] mt-0.5">Gemini Intelligence AI</p>
                </div>
              </div>
              <button 
                data-html2canvas-ignore
                onClick={handleOpenConfig}
                className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2"
              >
                <i className="fas fa-cog"></i> Configurar
              </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className={`relative rounded-3xl border p-8 h-fit min-h-full ${
              hasData ? 'border-[#006837]/10 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-white/5 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sincronizando Banco de Dados...</span>
                </div>
              ) : (
                <div className="relative">
                  <div className={`text-[14px] leading-relaxed whitespace-pre-line ${isKeyMissing ? 'text-red-400 italic' : 'text-slate-300 font-normal'}`}>
                    {renderReportText(report)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8 pt-4 border-t border-white/5 shrink-0 bg-[#050807]/90 flex gap-4">
              <button 
                data-html2canvas-ignore
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-[#f1c40f] py-4 text-[10px] font-black text-black hover:bg-white transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i> 
                {isExporting ? 'Processando...' : 'Exportar Relatório PDF'}
              </button>
              {player.videoUrl && (
                <a data-html2canvas-ignore href={player.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-red-600/90 py-4 text-[10px] font-black text-white hover:bg-red-600 transition-all uppercase tracking-widest">
                  <i className="fab fa-youtube"></i> Vídeo Scouting
                </a>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
