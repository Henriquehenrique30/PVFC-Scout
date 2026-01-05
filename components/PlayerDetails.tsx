
import React, { useEffect, useState } from 'react';
import { Player, Recommendation } from '../types';
import { getScoutReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, onClose }) => {
  const [report, setReport] = useState<string>('Processando inteligência tática...');
  const [loading, setLoading] = useState(true);

  const hasData = !!player.aiContextData;

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const res = await getScoutReport(player);
      setReport(res);
      setLoading(false);
    };
    fetchReport();
  }, [player]);

  const radarData = [
    { subject: 'VEL', A: player.stats.pace },
    { subject: 'FIN', A: player.stats.shooting },
    { subject: 'PAS', A: player.stats.passing },
    { subject: 'DRB', A: player.stats.dribbling },
    { subject: 'DEF', A: player.stats.defending },
    { subject: 'FIS', A: player.stats.physical },
  ];

  const getRecLabel = (rec: Recommendation) => {
    switch(rec) {
      case 'G1 Elite': return 'Prioridade Elite';
      case 'G2 Titular': return 'Potencial Titular';
      case 'G3 Monitoramento': return 'Em Observação';
      case 'Base': return 'Projeção Base';
      default: return rec;
    }
  };

  const getFootLabel = (foot: string) => {
    switch(foot) {
      case 'Right': return 'Destro';
      case 'Left': return 'Canhoto';
      case 'Both': return 'Ambidestro';
      default: return foot;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[1.5rem] bg-[#0f1a16] shadow-2xl border border-[#006837]/30 max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#006837] text-white hover:bg-[#f1c40f] hover:text-slate-950 transition-all shadow-lg"
        >
          <i className="fas fa-times text-[10px]"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto custom-scrollbar h-full">
          {/* LADO ESQUERDO: PERFIL (ULTRA COMPACTO) */}
          <div className="md:col-span-5 p-4 bg-gradient-to-br from-[#0a0f0d] to-[#0f1a16] border-r border-white/5 flex flex-col items-center">
            <div className="relative mt-2">
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="h-24 w-24 rounded-xl object-cover shadow-xl border border-[#006837]/50"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-2 py-0.5 rounded-full text-[6px] font-black text-slate-950 uppercase shadow-lg whitespace-nowrap">
                {player.recommendation}
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <h2 className="font-oswald text-xl font-bold uppercase text-white leading-none">{player.name}</h2>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="text-[9px] font-bold text-[#f1c40f] uppercase tracking-tighter">{player.position1}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-slate-700"></span>
                <span className="text-[9px] text-slate-500 font-semibold">{player.club}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1.5 w-full">
              <div className="rounded-lg bg-slate-900/50 p-1.5 border border-[#006837]/10 text-center">
                <div className="text-[6px] text-slate-500 uppercase font-black mb-0.5">Rating</div>
                <div className="text-[9px] font-bold text-white truncate">{getRecLabel(player.recommendation)}</div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-1.5 border border-[#006837]/10 text-center">
                <div className="text-[6px] text-slate-500 uppercase font-black mb-0.5">Ano</div>
                <div className="text-[9px] font-bold text-[#f1c40f]">{player.scoutYear}</div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-1.5 border border-[#006837]/10 text-center">
                <div className="text-[6px] text-slate-500 uppercase font-black mb-0.5">Altura</div>
                <div className="text-[9px] font-bold text-white">{player.height} cm</div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-1.5 border border-[#006837]/10 text-center">
                <div className="text-[6px] text-slate-500 uppercase font-black mb-0.5">Pé</div>
                <div className="text-[9px] font-bold text-white">{getFootLabel(player.foot)}</div>
              </div>
            </div>

            <div className="mt-2 h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 6, fontWeight: 800 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name={player.name}
                    dataKey="A"
                    stroke="#f1c40f"
                    fill="#f1c40f"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LADO DIREITO: DASHBOARD TÉCNICO */}
          <div className="md:col-span-7 p-5 bg-[#050807] flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#006837]/20 flex items-center justify-center text-[#f1c40f] text-sm border border-[#006837]/30">
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-md font-bold uppercase text-white">Análise IA</h3>
                  <p className="text-[6px] font-bold text-[#006837] uppercase tracking-[0.2em]">Intel v6.0</p>
                </div>
              </div>
              {hasData && (
                <div className="bg-[#f1c40f]/10 px-1.5 py-0.5 rounded border border-[#f1c40f]/20">
                  <span className="text-[6px] font-black text-[#f1c40f] uppercase">Base Ativa</span>
                </div>
              )}
            </div>

            <div className={`rounded-lg border p-3 transition-all min-h-[60px] flex items-center ${
              hasData 
                ? 'border-[#006837]/30 bg-gradient-to-br from-[#006837]/10 to-transparent' 
                : 'border-red-500/20 bg-red-500/5'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center gap-1.5 py-2 w-full">
                  <div className="h-4 w-4 animate-spin rounded-full border border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-[6px] font-black uppercase text-slate-600 tracking-widest">Sincronizando...</span>
                </div>
              ) : (
                <div className="flex gap-2.5 items-start">
                  {!hasData && <i className="fas fa-info-circle text-orange-500 text-[10px] mt-0.5 shrink-0"></i>}
                  <p className={`text-[11px] leading-snug ${
                    hasData ? 'text-slate-200 italic font-medium' : 'text-orange-200/70 font-bold'
                  }`}>
                    {hasData ? `"${report}"` : report}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <h4 className="text-[6px] font-black uppercase text-slate-600 tracking-[0.3em] flex items-center gap-1.5">
                  <span className="h-px w-2 bg-[#006837]"></span> Scouting
                </h4>
                <div className="rounded-lg bg-slate-900/40 p-2.5 border border-white/5">
                    <p className="text-[10px] text-slate-400">
                      Visto em <span className="text-white font-bold">{player.gamesWatched} Jogos</span> - <span className="text-[#f1c40f] font-bold">{player.competition}</span>.
                    </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[6px] font-black uppercase text-slate-600 tracking-[0.3em] flex items-center gap-1.5">
                  <span className="h-px w-2 bg-[#f1c40f]"></span> Staff
                </h4>
                <div className="rounded-lg bg-slate-900/40 p-2.5 border border-white/5">
                    <div className="mb-1">
                      <p className="text-[9px] text-white font-bold truncate">Ag: {player.agent || 'N/A'}</p>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">Ct: {player.contact || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {player.videoUrl && (
                <a 
                  href={player.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-[7px] font-black text-white hover:bg-red-500 transition-all shadow-lg uppercase tracking-wider"
                >
                  <i className="fab fa-youtube"></i> Vídeo
                </a>
              )}
              {player.ogolUrl && (
                <a 
                  href={player.ogolUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[7px] font-black text-[#006837] hover:bg-slate-100 transition-all shadow-lg uppercase tracking-wider border border-slate-200"
                >
                  <i className="fas fa-database"></i> oGol
                </a>
              )}
            </div>

            <div className="mt-auto pt-4 text-center">
              <p className="text-[5px] text-slate-800 uppercase tracking-[0.3em] border-t border-white/5 pt-2">
                Confidencial Porto Vitória FC - Documento de Analítico
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
