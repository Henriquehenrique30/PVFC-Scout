
import React, { useEffect, useState, useRef } from 'react';
import { Player } from '../types';
import { getScoutReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
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
      if (err.message === 'API_KEY_MISSING') {
        setIsKeyMissing(true);
        setReport("CHAVE INVÁLIDA: Por favor, selecione sua chave de API no painel de configurações.");
      } else {
        setReport("Erro ao carregar análise técnica. Verifique o console.");
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
      // Pequeno delay para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(reportContainerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050807',
        logging: false,
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
      pdf.save(`Relatorio_${player.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao exportar dossiê.");
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

  const radarData = [
    { subject: 'VEL', A: player.stats.pace },
    { subject: 'FIN', A: player.stats.shooting },
    { subject: 'PAS', A: player.stats.passing },
    { subject: 'DRB', A: player.stats.dribbling },
    { subject: 'DEF', A: player.stats.defending },
    { subject: 'FIS', A: player.stats.physical },
  ];

  const averageRating = Math.round(
    (player.stats.pace + player.stats.shooting + player.stats.passing + 
     player.stats.dribbling + player.stats.defending + player.stats.physical) / 6
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-hidden">
      <div ref={reportContainerRef} className="relative w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#050807] shadow-[0_0_80px_rgba(0,104,55,0.1)] border border-white/5 h-[90vh] max-h-[850px] flex flex-col md:flex-row animate-in fade-in zoom-in duration-500">
        
        <button 
          onClick={onClose}
          data-html2canvas-ignore
          className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 text-white hover:bg-red-600 transition-all border border-white/10 group shadow-2xl"
        >
          <i className="fas fa-times group-hover:rotate-90 transition-transform"></i>
        </button>

        {/* SIDEBAR ESQUERDA (DADOS CADASTRAIS) */}
        <div className="md:w-[35%] lg:w-[30%] p-8 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center overflow-y-auto custom-scrollbar h-full shrink-0">
          
          <div className="relative group shrink-0">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#006837] via-[#f1c40f] to-[#006837] rounded-[2.2rem] blur-sm opacity-10"></div>
            <img 
              src={player.photoUrl} 
              alt={player.name} 
              className="relative h-44 w-44 rounded-[2rem] object-cover object-top border-4 border-[#050807] shadow-2xl"
              crossOrigin="anonymous"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-5 py-1.5 rounded-full text-[9px] font-black text-slate-950 uppercase shadow-2xl border-4 border-[#0a0f0d] tracking-widest text-center min-w-[110px]">
              {player.recommendation}
            </div>
          </div>
          
          <div className="mt-10 text-center shrink-0 w-full">
            <h2 className="font-oswald text-3xl font-bold uppercase text-white tracking-tighter leading-tight">{player.name}</h2>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-[11px] font-black text-[#006837] uppercase tracking-[0.2em]">{player.position1}</span>
              <span className="h-1 w-1 rounded-full bg-slate-800"></span>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{player.club}</span>
            </div>
            
            <div className="mt-4 flex items-center justify-center">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <i className="fas fa-trophy text-[#f1c40f]"></i>
                  {player.competition || 'Competição N/A'}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 w-full shrink-0">
            {[
              { label: 'OVR', val: averageRating, color: 'text-[#f1c40f]' },
              { label: 'TEMPORADA', val: player.scoutYear },
              { label: 'IDADE', val: player.age },
              { label: 'ALTURA', val: `${player.height}cm` }
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl bg-white/5 p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                <div className="text-[8px] text-slate-600 uppercase font-black mb-0.5 tracking-widest">{item.label}</div>
                <div className={`text-xl font-black ${item.color || 'text-white'}`}>{item.val}</div>
              </div>
            ))}
          </div>

          {(player.agent || player.contact) && (
            <div className="mt-6 w-full rounded-2xl bg-[#0f1a16] p-5 border border-[#006837]/20 shrink-0 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-5">
                  <i className="fas fa-handshake text-4xl text-white"></i>
               </div>
              <h4 className="text-[8px] font-black text-[#006837] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                 <i className="fas fa-user-tie"></i> Staff / Gestão
              </h4>
              {player.agent && (
                <div className="mb-3 last:mb-0 relative z-10">
                  <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Representante / Agência</p>
                  <p className="text-xs font-bold text-white uppercase truncate tracking-wide">{player.agent}</p>
                </div>
              )}
              {player.contact && (
                <div className="last:mb-0 relative z-10">
                  <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Contato Direto</p>
                  <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5 w-fit">
                     <i className="fab fa-whatsapp text-[#006837]"></i>
                     <p className="text-[10px] font-bold text-[#f1c40f] tracking-wider">{player.contact}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 h-56 w-full shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#006837" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} />
                <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name={player.name}
                  dataKey="A"
                  stroke="#f1c40f"
                  fill="#f1c40f"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONTEÚDO DIREITA (RELATÓRIO IA) */}
        <div className="flex-1 flex flex-col h-full bg-[#050807] overflow-hidden border-t md:border-t-0 md:border-l border-white/5">
          
          <div className="p-8 pb-4 border-b border-white/5 shrink-0 bg-[#050807]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] text-xl border border-[#006837]/20">
                  <i className="fas fa-brain"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white tracking-wide">Relatório Técnico IA</h3>
                  <p className="text-[9px] font-black text-[#006837] uppercase tracking-[0.4em] mt-0.5 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    Gemini 3 Flash Analysis
                  </p>
                </div>
              </div>
              <button 
                data-html2canvas-ignore
                onClick={handleOpenConfig}
                className="flex items-center gap-2 transition-all px-4 py-2 rounded-xl border border-white/5 bg-slate-900/50 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800"
              >
                <i className="fas fa-cog"></i> Configurar
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className={`relative rounded-[2rem] border p-8 shadow-2xl h-fit min-h-full transition-all ${
              hasData ? 'border-[#006837]/10 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-slate-800 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
                  <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#f1c40f] border-t-transparent"></div>
                  <div className="text-center">
                    <span className="text-[9px] font-black uppercase text-white tracking-[0.5em] block mb-1">Processando Métricas</span>
                    <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Aguarde a análise do scout...</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <i className="fas fa-quote-left text-5xl text-[#006837]/5 absolute -top-4 -left-2 pointer-events-none"></i>
                  <div className={`text-[10px] leading-snug tracking-tight whitespace-pre-line ${isKeyMissing ? 'text-red-400 italic text-center' : 'text-slate-300 font-normal'}`}>
                    {renderReportText(report)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8 pt-4 border-t border-white/5 shrink-0 bg-[#050807]/80 backdrop-blur-md">
            <div className="flex gap-4">
              <button 
                data-html2canvas-ignore
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-[#f1c40f] px-6 py-4 text-[10px] font-black text-black hover:bg-white transition-all shadow-xl uppercase tracking-widest disabled:opacity-50"
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'} text-lg`}></i> 
                {isExporting ? 'Gerando PDF...' : 'Exportar Relatório PDF'}
              </button>
              {player.videoUrl && (
                <a data-html2canvas-ignore href={player.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-red-600/90 px-6 py-4 text-[10px] font-black text-white hover:bg-red-600 transition-all shadow-xl uppercase tracking-widest">
                  <i className="fab fa-youtube text-lg"></i> Vídeo
                </a>
              )}
              {player.ogolUrl && (
                <a data-html2canvas-ignore href={player.ogolUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white/5 px-6 py-4 text-[10px] font-black text-[#006837] hover:bg-white/10 hover:text-white transition-all shadow-xl uppercase tracking-widest border border-white/5">
                  <i className="fas fa-database text-sm"></i> oGol Data
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
