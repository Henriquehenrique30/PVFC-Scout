
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
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#00683722_0%,_transparent_70%)] pointer-events-none"></div>

      <div className="relative w-full max-w-6xl overflow-hidden rounded-[3rem] bg-[#050807] shadow-[0_0_100px_rgba(0,104,55,0.2)] border border-white/5 h-[92vh] max-h-[900px] flex flex-col animate-in fade-in zoom-in duration-500">
        
        {/* Top Floating Badge - Department Info */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-40 bg-black/40 backdrop-blur-md px-6 py-1.5 rounded-full border border-white/10 flex items-center gap-4 hidden md:flex">
          <span className="text-[8px] font-black text-[#006837] uppercase tracking-[0.3em]">Market Intelligence Dept</span>
          <div className="h-3 w-px bg-white/10"></div>
          <span className="text-[8px] font-black text-[#f1c40f] uppercase tracking-[0.3em]">Porto Vitória FC</span>
          <div className="h-3 w-px bg-white/10"></div>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">ID: PV-{player.id.slice(-4)}</span>
        </div>

        <button 
          onClick={onClose}
          className="absolute right-8 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/80 text-white hover:bg-red-600 transition-all border border-white/10 group shadow-2xl"
        >
          <i className="fas fa-times group-hover:rotate-90 transition-transform"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full overflow-hidden">
          
          {/* SIDEBAR ESQUERDA - PERFIL DO ATLETA */}
          <div className="md:col-span-4 p-8 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center overflow-y-auto custom-scrollbar h-full relative">
            
            {/* Foto com Overlay Tecnológico */}
            <div className="relative group shrink-0 mt-4">
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#006837] via-[#f1c40f] to-[#006837] rounded-[2.5rem] blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
              
              <div className="relative h-52 w-52 rounded-[2.2rem] overflow-hidden border-4 border-[#050807] shadow-2xl">
                <img 
                  src={player.photoUrl} 
                  alt={player.name} 
                  className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                />
                
                {/* HUD Scan Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[#f1c40f]/50 shadow-[0_0_15px_#f1c40f] animate-[scan_3s_linear_infinite]"></div>
                  <div className="absolute inset-0 border-[20px] border-black/20"></div>
                  <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-[#f1c40f]/60"></div>
                  <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-[#f1c40f]/60"></div>
                </div>

                {/* Recommendation Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 pt-8">
                  <div className="bg-[#f1c40f] px-4 py-1.5 rounded-xl text-[9px] font-black text-slate-950 uppercase shadow-2xl tracking-widest text-center border border-white/20">
                    {player.recommendation}
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="absolute -top-3 -right-3 h-10 w-10 bg-[#006837] rounded-2xl flex items-center justify-center text-white border-4 border-[#0a0f0d] shadow-2xl z-20">
                <i className="fas fa-check-shield text-xs"></i>
              </div>
            </div>
            
            <div className="mt-12 text-center shrink-0">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] block mb-2">Technical Dossier</span>
              <h2 className="font-oswald text-4xl font-bold uppercase text-white tracking-tighter leading-tight">{player.name}</h2>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="px-3 py-1 rounded-lg bg-[#006837]/20 border border-[#006837]/30 text-[10px] font-black text-[#006837] uppercase tracking-widest">{player.position1}</div>
                <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{player.club}</div>
              </div>
            </div>

            {/* Grid de Dados Estilo Painel de Controle */}
            <div className="mt-10 grid grid-cols-2 gap-4 w-full shrink-0">
              {[
                { label: 'Rating OVR', val: averageRating, color: 'text-[#f1c40f]', icon: 'fa-star' },
                { label: 'Scout Ref.', val: player.scoutYear, icon: 'fa-calendar-check' },
                { label: 'Age Status', val: player.age, icon: 'fa-user-clock' },
                { label: 'Physique', val: `${player.height}cm`, icon: 'fa-ruler-vertical' }
              ].map((item, idx) => (
                <div key={idx} className="relative rounded-2xl bg-white/5 p-4 border border-white/5 overflow-hidden group/item hover:border-[#006837]/30 transition-all">
                  <div className="absolute -right-2 -top-2 opacity-[0.03] text-4xl text-white">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className="text-[8px] text-slate-500 uppercase font-black mb-1.5 tracking-widest flex items-center gap-2">
                    <i className={`fas ${item.icon} text-[7px]`}></i>
                    {item.label}
                  </div>
                  <div className={`text-2xl font-black ${item.color || 'text-white'}`}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Gráfico Radar - HUD Design */}
            <div className="mt-8 h-60 w-full shrink-0 relative">
               <div className="absolute inset-0 bg-[#006837]/5 rounded-full blur-3xl"></div>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.15} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name={player.name}
                    dataKey="A"
                    stroke="#f1c40f"
                    fill="#f1c40f"
                    fillOpacity={0.2}
                    animationDuration={1500}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CONTEÚDO DIREITA - RELATÓRIO E ANÁLISE */}
          <div className="md:col-span-8 flex flex-col h-full bg-[#050807] overflow-hidden">
            
            {/* Header Técnico */}
            <div className="p-10 pb-6 border-b border-white/5 shrink-0 bg-gradient-to-r from-transparent via-white/2 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-[#f1c40f] rounded-2xl blur-md opacity-20"></div>
                    <div className="relative h-14 w-14 rounded-2xl bg-black border border-[#f1c40f]/30 flex items-center justify-center text-[#f1c40f] text-2xl">
                      <i className="fas fa-microchip"></i>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-oswald text-3xl font-bold uppercase text-white tracking-wide">Análise de Mercado IA</h3>
                      <span className="bg-red-600/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded border border-red-500/20 tracking-widest uppercase">Confidential</span>
                    </div>
                    <p className="text-[10px] font-black text-[#006837] uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Gemini Neural Engine 3.1
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <button 
                    onClick={handleOpenConfig}
                    className="flex items-center gap-2 transition-all px-4 py-3 rounded-xl border border-white/5 bg-slate-900/40 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800"
                  >
                    <i className="fas fa-terminal"></i> Config
                  </button>
                </div>
              </div>
            </div>

            {/* Scroll Container do Relatório */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pt-4">
              <div className={`relative rounded-[2.5rem] border p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-fit min-h-full transition-all group/report ${
                hasData ? 'border-[#006837]/15 bg-[#0a0f0d]/40' : 'border-slate-800 bg-slate-900/10'
              }`}>
                
                {/* Visual Details for the Dossier */}
                <div className="absolute top-8 right-8 flex flex-col items-end opacity-20 pointer-events-none">
                  <div className="h-1 w-20 bg-[#006837] mb-1"></div>
                  <div className="h-1 w-12 bg-[#006837]"></div>
                  <span className="text-[7px] font-black text-[#006837] uppercase mt-2">Classified Data</span>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
                    <div className="relative">
                       <div className="absolute -inset-4 border-2 border-[#f1c40f]/20 rounded-full animate-[ping_2s_infinite]"></div>
                       <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#f1c40f] border-t-transparent shadow-[0_0_20px_rgba(241,196,15,0.3)]"></div>
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] font-black uppercase text-white tracking-[0.8em] block mb-2">Decriptando Dados</span>
                      <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Sincronizando com a base de scouts...</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <i className="fas fa-file-invoice text-7xl text-[#006837]/5 absolute -top-4 -left-2 pointer-events-none"></i>
                    <div className={`text-[13.5px] leading-[1.8] tracking-tight whitespace-pre-line ${isKeyMissing ? 'text-red-400 italic text-center' : 'text-slate-300 font-normal'}`}>
                      {renderReportText(report)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Ações de Mercado Fixo */}
            <div className="p-10 pt-6 border-t border-white/5 shrink-0 bg-[#050807]/90 backdrop-blur-xl">
              <div className="flex gap-6">
                {player.videoUrl && (
                  <a href={player.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-red-600/90 px-8 py-5 text-[11px] font-black text-white hover:bg-red-600 hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(220,38,38,0.2)] uppercase tracking-[0.2em]">
                    <i className="fab fa-youtube text-xl"></i> Performance Video
                  </a>
                )}
                {player.ogolUrl && (
                  <a href={player.ogolUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-white/5 px-8 py-5 text-[11px] font-black text-slate-300 hover:bg-white/10 hover:text-white hover:scale-[1.02] transition-all shadow-xl uppercase tracking-[0.2em] border border-white/10">
                    <i className="fas fa-database text-lg text-[#006837]"></i> oGol Database
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default PlayerDetails;
