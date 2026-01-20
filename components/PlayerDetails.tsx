
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
        className="relative w-full max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#050807] shadow-2xl border border-white/5 h-[90vh] flex flex-col md:flex-row animate-in fade-in zoom-in duration-500"
      >
        
        <button 
          onClick={onClose}
          data-html2canvas-ignore
          className="absolute right-8 top-8 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 text-white hover:bg-red-600 transition-all border border-white/10"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* SIDEBAR ESQUERDA (DADOS CADASTRAIS) */}
        <div className="md:w-[30%] lg:w-[25%] p-10 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center shrink-0 h-full">
          
          {/* Logo do Clube para validação do sistema */}
          <div className="mb-6 flex flex-col items-center">
            <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-2xl border border-white/10 mb-2">
              <img 
                src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" 
                alt="Porto Vitória FC" 
                className="h-full w-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <p className="text-[7px] font-black text-[#006837] uppercase tracking-[0.4em]">Propriedade Institucional</p>
          </div>

          <div className="relative shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-tr from-[#006837] to-[#f1c40f] rounded-[2.5rem] blur-md opacity-20"></div>
            <img 
              src={player.photoUrl} 
              alt={player.name} 
              className="relative h-48 w-48 rounded-[2.5rem] object-cover object-top border-2 border-white/10 shadow-2xl"
              crossOrigin="anonymous"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-6 py-2 rounded-full text-[10px] font-black text-slate-950 uppercase shadow-2xl tracking-tighter text-center min-w-[140px] border border-black/10">
              {player.recommendation}
            </div>
          </div>
          
          <div className="mt-10 text-center shrink-0 w-full">
            <h2 className="font-oswald text-4xl font-bold uppercase text-white leading-tight tracking-tight">{player.name}</h2>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-[12px] font-black text-[#006837] uppercase bg-[#006837]/10 px-3 py-1 rounded-lg border border-[#006837]/20">{player.position1}</span>
              <span className="text-[12px] text-slate-500 font-bold uppercase tracking-widest">{player.club}</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 w-full shrink-0">
            {[
              { label: 'IDADE', val: player.age },
              { label: 'ALTURA', val: `${player.height}cm` },
              { label: 'PÉ', val: footLabel },
              { label: 'JOGOS', val: player.gamesWatched },
              { label: 'TEMP.', val: player.scoutYear },
              { label: 'LIGA', val: player.competition || 'N/A' }
            ].map((item, idx) => (
              <div key={idx} className="rounded-2xl bg-white/5 p-4 border border-white/5 text-center transition-colors hover:bg-white/[0.07]">
                <div className="text-[9px] text-slate-600 uppercase font-black mb-1.5 tracking-widest">{item.label}</div>
                <div className="text-base font-bold text-white leading-none">{item.val}</div>
              </div>
            ))}
          </div>

          {(player.agent || player.contact) && (
            <div className="mt-10 w-full rounded-[2rem] bg-[#0f1a16] p-6 border border-[#006837]/20 shrink-0">
              <h4 className="text-[9px] font-black text-[#006837] uppercase tracking-widest mb-4 flex items-center gap-2">
                 <i className="fas fa-user-tie"></i> Contato / Agente
              </h4>
              <div className="space-y-4">
                {player.agent && (
                  <div>
                    <span className="text-slate-500 font-black text-[9px] uppercase block mb-1">Representante</span>
                    <p className="text-[12px] font-bold text-white">{player.agent}</p>
                  </div>
                )}
                {player.contact && (
                  <div className="text-[12px] font-bold text-[#f1c40f] flex items-center gap-3 bg-black/30 p-3 rounded-xl">
                    <i className="fab fa-whatsapp text-xl text-[#006837]"></i>
                    {player.contact}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTEÚDO DIREITA (RELATÓRIO IA) */}
        <div className="flex-1 flex flex-col h-full bg-[#050807] overflow-hidden border-l border-white/5">
          
          <div className="p-10 pb-6 border-b border-white/5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] border border-[#006837]/20 shadow-inner">
                  <i className="fas fa-brain text-2xl"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-3xl font-bold uppercase text-white tracking-tight">Análise de Performance</h3>
                  <p className="text-[10px] font-black text-[#006837] uppercase tracking-[0.4em] mt-1">Gemini Intelligence AI Engine</p>
                </div>
              </div>
              <div className="flex items-center gap-4" data-html2canvas-ignore>
                <button 
                  onClick={handleOpenConfig}
                  className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                >
                  <i className="fas fa-cog"></i> Configurar IA
                </button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            <div className={`relative rounded-[2.5rem] border p-10 h-fit min-h-full ${
              hasData ? 'border-[#006837]/10 bg-gradient-to-br from-[#0a0f0d] to-transparent shadow-inner' : 'border-white/5 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1c40f] border-t-transparent"></div>
                  <div className="text-center">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-2">Sincronizando Banco de Dados...</span>
                    <p className="text-[9px] text-slate-700 uppercase font-bold">Processando parâmetros táticos do atleta</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className={`text-[16px] leading-[1.8] whitespace-pre-line ${isKeyMissing ? 'text-red-400 italic' : 'text-slate-300 font-normal'}`}>
                    {renderReportText(report)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-10 pt-6 border-t border-white/5 shrink-0 bg-[#050807]/95 backdrop-blur-md flex gap-4">
              <button 
                data-html2canvas-ignore
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-[#f1c40f] py-5 text-[11px] font-black text-black hover:bg-white transition-all uppercase tracking-[0.15em] disabled:opacity-50 shadow-xl"
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-lg`}></i> 
                {isExporting ? 'Processando PDF...' : 'Gerar Dossiê Técnico PDF'}
              </button>
              
              {player.videoUrl && (
                <a 
                  data-html2canvas-ignore 
                  href={player.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-red-600/90 py-5 text-[11px] font-black text-white hover:bg-red-600 transition-all uppercase tracking-[0.15em] shadow-xl"
                >
                  <i className="fab fa-youtube text-lg"></i> Vídeo Scouting
                </a>
              )}

              {player.ogolUrl && (
                <a 
                  data-html2canvas-ignore 
                  href={player.ogolUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-slate-800 py-5 text-[11px] font-black text-white hover:bg-slate-700 transition-all uppercase tracking-[0.15em] border border-white/10 shadow-xl"
                >
                  <i className="fas fa-external-link-alt text-lg"></i> Perfil oGol
                </a>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
