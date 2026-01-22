
import React, { useEffect, useState, useRef } from 'react';
import { Player } from '../types';
import { getScoutReport } from '../services/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jsPDF';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, onClose }) => {
  const [report, setReport] = useState<string>('Sincronizando dados táticos...');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getScoutReport(player);
      setReport(res);
    } catch (err: any) {
      setReport("ERRO NO PROCESSAMENTO: Sistema de IA indisponível.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [player]);

  const handleExportPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportContainerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020403'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`PVFC_DOSSIE_${player.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert("Falha ao exportar dossiê.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderReportText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.match(/^\d\./)) {
        return <h4 key={i} className="text-[#f1c40f] font-oswald text-xl font-bold uppercase mt-8 mb-4 tracking-tight border-l-4 border-[#006837] pl-4">{line}</h4>;
      }
      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-3 text-slate-300 leading-relaxed text-[14px]">
          {boldParts.map((part, j) => 
            part.startsWith('**') ? <span key={j} className="text-white font-black">{part.slice(2, -2)}</span> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
      <div 
        ref={reportContainerRef}
        className="relative w-full max-w-7xl h-[85vh] overflow-hidden rounded-[2.5rem] glass-panel border border-white/10 flex flex-col md:flex-row"
      >
        <button 
          onClick={onClose}
          data-html2canvas-ignore
          className="absolute right-8 top-8 z-50 h-10 w-10 bg-white/5 text-white hover:bg-red-600 rounded-full transition-all border border-white/10"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Left Section: Visual Identity */}
        <div className="md:w-[32%] lg:w-[28%] bg-[#080b09] border-r border-white/10 p-10 flex flex-col h-full shrink-0">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 bg-white rounded-xl p-2 shadow-2xl mb-4">
              <img src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" className="h-full w-full object-contain" />
            </div>
            <p className="text-[7px] font-black text-[#006837] uppercase tracking-[0.4em]">Propriedade do Porto Vitória FC</p>
          </div>

          <div className="relative mx-auto mb-8">
            <div className="absolute -inset-4 bg-[#006837]/20 blur-2xl rounded-full"></div>
            <img 
              src={player.photoUrl} 
              className="relative h-56 w-56 rounded-[3rem] object-cover object-top border-2 border-white/10 shadow-2xl shadow-black/80" 
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#f1c40f] text-black text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-2xl border border-black/10">
              {player.recommendation}
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-oswald text-4xl font-bold uppercase text-white leading-none tracking-tight">{player.name}</h2>
            <p className="text-[12px] font-bold text-[#006837] uppercase tracking-widest mt-2">{player.club}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            {[
              { l: 'IDADE', v: player.age },
              { l: 'PERNA', v: player.foot === 'Right' ? 'DESTRO' : 'CANHOTO' },
              { l: 'ALTURA', v: `${player.height}cm` },
              { l: 'POSIÇÃO', v: player.position1 }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">{stat.l}</span>
                <span className="text-[12px] font-bold text-white uppercase">{stat.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Intel Report */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050807]/40">
          <div className="p-10 pb-6 border-b border-white/5 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] border border-[#006837]/20">
                <i className="fas fa-microchip text-2xl"></i>
              </div>
              <div>
                <h3 className="font-oswald text-2xl font-bold uppercase text-white tracking-tighter">Relatório Técnico</h3>
                <p className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mt-1">Sincronizado via Scout Engine</p>
              </div>
            </div>
            
            <button 
              data-html2canvas-ignore
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-6 py-3 rounded-xl bg-[#f1c40f] text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
            >
              <i className="fas fa-file-pdf mr-2"></i> Exportar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-gradient-to-b from-transparent to-[#000]/40">
             <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <div className="h-8 w-8 border-2 border-[#f1c40f] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Decodificando Atributos...</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-1000">
                    {renderReportText(report)}
                  </div>
                )}
             </div>
          </div>

          {/* External Links */}
          <div className="p-10 pt-6 border-t border-white/5 shrink-0 flex gap-4" data-html2canvas-ignore>
             {player.videoUrl && (
               <a href={player.videoUrl} target="_blank" className="flex-1 bg-red-600/10 border border-red-600/30 py-4 rounded-2xl flex items-center justify-center gap-3 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all">
                 <i className="fab fa-youtube text-lg"></i> Vídeo Scouting
               </a>
             )}
             {player.ogolUrl && (
               <a href={player.ogolUrl} target="_blank" className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-3 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">
                 <i className="fas fa-link text-lg"></i> Base oGol
               </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
