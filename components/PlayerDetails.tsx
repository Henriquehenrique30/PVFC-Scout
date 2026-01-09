
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
      // Pequeno delay para garantir que o DOM esteja estável
      await new Promise(resolve => setTimeout(resolve, 600));

      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050807',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth, // Força a captura a respeitar a largura atual
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

  const footLabel = player.foot === 'Right' ? 'Destro' : player.foot === 'Left' ? 'Canhoto' : 'Ambid.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-hidden">
      <div 
        ref={reportContainerRef} 
        className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#050807] shadow-2xl border border-white/5 h-[90vh] max-h-[820px] flex flex-col md:flex-row animate-in fade-in zoom-in duration-500"
      >
        
        <button 
          onClick={onClose}
          data-html2canvas-ignore
          className="absolute right-6 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-white hover:bg-red-600 transition-all border border-white/10"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* SIDEBAR ESQUERDA (DADOS CADASTRAIS) */}
        <div className="md:w-[32%] lg:w-[28%] p-6 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center shrink-0 h-full overflow-hidden">
          
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#006837] to-[#f1c40f] rounded-[1.8rem] blur-sm opacity-10"></div>
            <img 
              src={player.photoUrl} 
              alt={player.name} 
              className="relative h-32 w-32 rounded-[1.5rem] object-cover object-top border-2 border-white/5 shadow-xl"
              crossOrigin="anonymous"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-3 py-1 rounded-full text-[8px] font-black text-slate-950 uppercase shadow-xl tracking-tighter text-center min-w-[100px]">
              {player.recommendation}
            </div>
          </div>
          
          <div className="mt-5 text-center shrink-0 w-full">
            <h2 className="font-oswald text-2xl font-bold uppercase text-white leading-tight">{player.name}</h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-[10px] font-black text-[#006837] uppercase">{player.position1}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">{player.club}</span>
            </div>
            <div className="mt-2 flex justify-center">
              <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black text-[#f1c40f] uppercase flex items-center gap-2">
                  <i className="fas fa-trophy"></i> {player.competition || 'N/A'}
              </div>
            </div>
          </div>

          {/* GRID DE MÉTRICAS REDUZIDO (3 COLUNAS) - Alinhamento fixo para PDF */}
          <div className="mt-5 grid grid-cols-3 gap-2 w-full shrink-0">
            {[
              { label: 'OVR', val: averageRating, color: 'text-[#f1c40f]' },
              { label: 'PÉ', val: footLabel },
              { label: 'IDADE', val: player.age },
              { label: 'ALTURA', val: `${player.height}cm` },
              { label: 'TEMP.', val: player.scoutYear },
              { label: 'JOGOS', val: player.gamesWatched }
            ].map((item, idx) => (
              <div key={idx} className="rounded-lg bg-white/5 p-1.5 border border-white/5 text-center flex flex-col justify-center min-h-[40px]">
                <div className="text-[7px] text-slate-600 uppercase font-black mb-0.5 tracking-tighter leading-none">{item.label}</div>
                <div className={`text-xs font-black leading-none ${item.color || 'text-white'}`}>{item.val}</div>
              </div>
            ))}
          </div>

          {(player.agent || player.contact) && (
            <div className="mt-4 w-full rounded-xl bg-[#0f1a16] p-4 border border-[#006837]/20 shrink-0">
              <h4 className="text-[7px] font-black text-[#006837] uppercase tracking-widest mb-2 flex items-center gap-2">
                 <i className="fas fa-user-tie"></i> Staff / Contato
              </h4>
              <div className="flex flex-col gap-1">
                {player.agent && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-500 font-black text-[7px] uppercase shrink-0">Agente:</span>
                    <p className="text-[9px] font-bold text-white truncate">{player.agent}</p>
                  </div>
                )}
                {player.contact && (
                  <div className="text-[9px] font-bold text-[#f1c40f] flex items-center gap-1.5 mt-0.5">
                    <i className="fab fa-whatsapp text-[#006837] text-[8px]"></i>
                    {player.contact}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRÁFICO RADAR (Dimensões Estabilizadas para PDF) */}
          <div className="mt-4 h-40 w-full shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#006837" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} />
                <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name={player.name}
                  dataKey="A"
                  stroke="#f1c40f"
                  fill="#f1c40f"
                  fillOpacity={0.1}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONTEÚDO DIREITA (RELATÓRIO IA) */}
        <div className="flex-1 flex flex-col h-full bg-[#050807] overflow-hidden border-l border-white/5">
          
          <div className="p-6 pb-3 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] border border-[#006837]/20">
                  <i className="fas fa-brain"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-xl font-bold uppercase text-white">Análise Técnica</h3>
                  <p className="text-[8px] font-black text-[#006837] uppercase tracking-[0.3em] mt-0.5">Gemini Intelligence Report</p>
                </div>
              </div>
              <button 
                data-html2canvas-ignore
                onClick={handleOpenConfig}
                className="text-[8px] font-black uppercase text-slate-500 hover:text-white transition-colors"
              >
                <i className="fas fa-cog mr-1"></i> Configurar
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className={`relative rounded-2xl border p-6 h-fit min-h-full ${
              hasData ? 'border-[#006837]/10 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-white/5 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Compilando Dados...</span>
                </div>
              ) : (
                <div className="relative">
                  <div className={`text-[12px] leading-tight tracking-tight whitespace-pre-line ${isKeyMissing ? 'text-red-400 italic' : 'text-slate-300 font-normal'}`}>
                    {renderReportText(report)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 pt-3 border-t border-white/5 shrink-0 bg-[#050807]/90">
            <div className="flex gap-3">
              <button 
                data-html2canvas-ignore
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#f1c40f] py-3 text-[9px] font-black text-black hover:bg-white transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i> 
                {isExporting ? 'Processando...' : 'Exportar Dossier PDF'}
              </button>
              {player.videoUrl && (
                <a data-html2canvas-ignore href={player.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600/90 py-3 text-[9px] font-black text-white hover:bg-red-600 transition-all uppercase tracking-widest">
                  <i className="fab fa-youtube"></i> Vídeo
                </a>
              )}
              {player.ogolUrl && (
                <a data-html2canvas-ignore href={player.ogolUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-[9px] font-black text-[#006837] hover:text-white transition-all border border-white/5 uppercase tracking-widest">
                  oGol Data
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
