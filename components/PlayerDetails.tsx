
import React, { useEffect, useState } from 'react';
import { Player, Recommendation } from '../types';
import { getScoutReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, onClose }) => {
  const [report, setReport] = useState<string>('Decodificando métricas de performance...');
  const [loading, setLoading] = useState(true);
  const [isKeyMissing, setIsKeyMissing] = useState(false);

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
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      fetchReport();
    }
  };

  // Função para renderizar o texto com suporte básico a markdown (negritos)
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
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#050807] shadow-[0_0_80px_rgba(0,104,55,0.1)] border border-white/5 max-h-[94vh] flex flex-col animate-in fade-in zoom-in duration-500">
        
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 text-white hover:bg-red-600 transition-all border border-white/10 group shadow-2xl"
        >
          <i className="fas fa-times group-hover:rotate-90 transition-transform"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          
          {/* SIDEBAR ESQUERDA */}
          <div className="md:col-span-4 p-8 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center overflow-y-auto custom-scrollbar">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#006837] via-[#f1c40f] to-[#006837] rounded-[2.2rem] blur-sm opacity-10"></div>
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="relative h-48 w-48 rounded-[2rem] object-cover border-4 border-[#050807] shadow-2xl"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-5 py-1.5 rounded-full text-[9px] font-black text-slate-950 uppercase shadow-2xl border-4 border-[#0a0f0d] tracking-widest text-center min-w-[110px]">
                {player.recommendation}
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <h2 className="font-oswald text-3xl font-bold uppercase text-white tracking-tighter leading-tight">{player.name}</h2>
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="text-[11px] font-black text-[#006837] uppercase tracking-[0.2em]">{player.position1}</span>
                <span className="h-1 w-1 rounded-full bg-slate-800"></span>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{player.club}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 w-full">
              {[
                { label: 'OVR', val: averageRating, color: 'text-[#f1c40f]' },
                { label: 'AVALIAÇÃO', val: player.scoutYear },
                { label: 'IDADE', val: player.age },
                { label: 'ALTURA', val: `${player.height}cm` }
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl bg-white/5 p-4 border border-white/5 text-center transition-all hover:bg-white/10 hover:border-white/10">
                  <div className="text-[8px] text-slate-600 uppercase font-black mb-0.5 tracking-widest">{item.label}</div>
                  <div className={`text-xl font-black ${item.color || 'text-white'}`}>{item.val}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.1} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name={player.name}
                    dataKey="A"
                    stroke="#f1c40f"
                    fill="#f1c40f"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ÁREA DO RELATÓRIO */}
          <div className="md:col-span-8 p-10 flex flex-col h-full bg-[#050807] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] text-2xl border border-[#006837]/20 shadow-inner">
                  <i className="fas fa-brain"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white tracking-wide">Relatório Técnico IA</h3>
                  <p className="text-[9px] font-black text-[#006837] uppercase tracking-[0.4em] mt-0.5 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    Gemini 3 Flash Active
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleOpenConfig}
                className="flex items-center gap-2 transition-all px-4 py-2 rounded-xl border border-white/5 bg-slate-900/50 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 shadow-xl"
              >
                <i className="fas fa-cog"></i> Configurar
              </button>
            </div>

            <div className={`relative rounded-[2rem] border p-10 flex-grow transition-all flex flex-col shadow-2xl ${
              hasData ? 'border-[#006837]/20 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-slate-800 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
                  <div className="h-12 w-12 animate-spin rounded-full border-[4px] border-[#f1c40f] border-t-transparent"></div>
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-white tracking-[0.5em] block mb-1">Processando Métricas</span>
                    <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Aguarde a análise do scout...</span>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-y-auto custom-scrollbar pr-4">
                  <i className="fas fa-quote-left text-6xl text-[#006837]/5 absolute -top-4 -left-2 pointer-events-none"></i>
                  <div className="relative z-10">
                    <div className={`text-[13px] sm:text-sm leading-relaxed tracking-normal whitespace-pre-line ${isKeyMissing ? 'text-red-400 italic text-center' : 'text-slate-300 font-normal'}`}>
                      {renderReportText(report)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex gap-4">
              {player.videoUrl && (
                <a href={player.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-red-600/90 px-6 py-4 text-[10px] font-black text-white hover:bg-red-600 transition-all shadow-xl uppercase tracking-widest">
                  <i className="fab fa-youtube text-lg"></i> Assistir Vídeo
                </a>
              )}
              {player.ogolUrl && (
                <a href={player.ogolUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-[10px] font-black text-[#006837] hover:bg-slate-100 transition-all shadow-xl uppercase tracking-widest border border-slate-200">
                  <i className="fas fa-database text-sm"></i> Base oGol
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
