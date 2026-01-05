
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
      case 'G1 Elite': return 'Prioridade Estratégica';
      case 'G2 Titular': return 'Potencial Titular';
      case 'G3 Monitoramento': return 'Em Observação';
      case 'Base': return 'Projeção de Base';
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
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-[#0f1a16] shadow-2xl border border-[#006837]/30 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#006837] text-white hover:bg-[#f1c40f] hover:text-slate-950 transition-all shadow-lg"
        >
          <i className="fas fa-times text-xs"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto custom-scrollbar h-full">
          {/* LADO ESQUERDO: PERFIL VISUAL (Compacto) */}
          <div className="md:col-span-5 p-6 bg-gradient-to-br from-[#0a0f0d] to-[#0f1a16] border-r border-white/5 flex flex-col items-center">
            <div className="relative">
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="h-32 w-32 rounded-2xl object-cover shadow-2xl border-2 border-[#006837]/50"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-3 py-0.5 rounded-full text-[8px] font-black text-slate-950 uppercase shadow-xl whitespace-nowrap">
                {player.recommendation}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <h2 className="font-oswald text-3xl font-bold uppercase text-white leading-tight">{player.name}</h2>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-[#f1c40f] uppercase tracking-widest">{player.position1}</span>
                <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                <span className="text-xs text-slate-400 font-semibold">{player.club}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 w-full">
              <div className="rounded-xl bg-slate-900/50 p-3 border border-[#006837]/10 text-center">
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Qualificação</div>
                <div className="text-[10px] font-bold text-white truncate">{getRecLabel(player.recommendation)}</div>
              </div>
              <div className="rounded-xl bg-slate-900/50 p-3 border border-[#006837]/10 text-center">
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Ano Avaliação</div>
                <div className="text-xs font-bold text-[#f1c40f]">{player.scoutYear}</div>
              </div>
              <div className="rounded-xl bg-slate-900/50 p-3 border border-[#006837]/10 text-center">
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Altura</div>
                <div className="text-xs font-bold text-white">{player.height} cm</div>
              </div>
              <div className="rounded-xl bg-slate-900/50 p-3 border border-[#006837]/10 text-center">
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Pé Dominante</div>
                <div className="text-xs font-bold text-white">{getFootLabel(player.foot)}</div>
              </div>
            </div>

            <div className="mt-4 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 700 }} />
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

          {/* LADO DIREITO: ANÁLISE TÉCNICA */}
          <div className="md:col-span-7 p-6 bg-[#050807] flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#006837]/20 flex items-center justify-center text-[#f1c40f] text-lg border border-[#006837]/30">
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-lg font-bold uppercase text-white tracking-wide">Performance IA</h3>
                  <p className="text-[8px] font-bold text-[#006837] uppercase tracking-[0.2em]">Scout Pro Intel v6.0</p>
                </div>
              </div>
              {hasData && (
                <div className="hidden sm:flex items-center gap-2 bg-[#f1c40f]/10 px-2 py-0.5 rounded-lg border border-[#f1c40f]/20">
                  <i className="fas fa-certificate text-[#f1c40f] text-[7px]"></i>
                  <span className="text-[7px] font-black text-[#f1c40f] uppercase tracking-widest">Base Certificada</span>
                </div>
              )}
            </div>

            <div className={`rounded-xl border p-4 transition-all min-h-[80px] flex items-center ${
              hasData 
                ? 'border-[#006837]/30 bg-gradient-to-br from-[#006837]/10 to-transparent' 
                : 'border-orange-500/20 bg-orange-500/5'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-4 w-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Sincronizando...</span>
                </div>
              ) : (
                <div className="flex gap-3 items-start">
                  {!hasData && <i className="fas fa-exclamation-triangle text-orange-500 text-sm mt-1 shrink-0"></i>}
                  <p className={`text-sm leading-relaxed ${
                    hasData ? 'text-slate-200 italic font-medium' : 'text-orange-200/70 font-bold'
                  }`}>
                    {hasData ? `"${report}"` : report}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-[8px] font-black uppercase text-slate-600 tracking-[0.3em] flex items-center gap-2">
                  <span className="h-px w-4 bg-[#006837]"></span> Analista
                </h4>
                <div className="rounded-xl bg-slate-900/40 p-4 border border-white/5">
                    <span className="text-[8px] font-black text-[#006837] uppercase block mb-1">Status</span>
                    <p className="text-[11px] text-slate-400">
                      Visto em <span className="text-white font-bold">{player.gamesWatched} Jogos</span> na <span className="text-[#f1c40f] font-bold">{player.competition}</span>.
                    </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[8px] font-black uppercase text-slate-600 tracking-[0.3em] flex items-center gap-2">
                  <span className="h-px w-4 bg-[#f1c40f]"></span> Gestão
                </h4>
                <div className="rounded-xl bg-slate-900/40 p-4 border border-white/5">
                    <div className="mb-2">
                      <span className="text-[8px] font-black text-[#f1c40f] uppercase block mb-0.5">Agente</span>
                      <p className="text-[11px] text-white font-bold truncate">{player.agent || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-[#006837] uppercase block mb-0.5">Contato</span>
                      <p className="text-[11px] text-slate-400 truncate">{player.contact || 'N/A'}</p>
                    </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {player.videoUrl && (
                <a 
                  href={player.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-[9px] font-black text-white hover:bg-red-500 transition-all shadow-lg uppercase tracking-widest"
                >
                  <i className="fab fa-youtube"></i> Vídeo Scout
                </a>
              )}
              {player.ogolUrl && (
                <a 
                  href={player.ogolUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[9px] font-black text-[#006837] hover:bg-slate-100 transition-all shadow-lg uppercase tracking-widest border border-slate-200"
                >
                  <i className="fas fa-database"></i> Perfil oGol
                </a>
              )}
            </div>

            <div className="mt-auto pt-6 text-center">
              <p className="text-[7px] text-slate-700 uppercase tracking-[0.2em] border-t border-white/5 pt-4">
                Documento Interno - Porto Vitória Futebol Clube
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
