
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
      try {
        const res = await getScoutReport(player);
        setReport(res);
      } catch (err) {
        setReport("Erro ao carregar análise.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [player]);

  const handleFixKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Recarrega o parecer após selecionar a chave
      const res = await getScoutReport(player);
      setReport(res);
    }
  };

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
      case 'G3 Monitoramento': return 'Monitoramento';
      case 'Base': return 'Projeção Base';
      default: return rec;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-[#050807] shadow-2xl border border-[#006837]/30 max-h-[88vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-red-600 transition-all border border-white/10"
        >
          <i className="fas fa-times text-xs"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full overflow-hidden">
          
          {/* PERFIL (ESQUERDA) */}
          <div className="md:col-span-5 p-5 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center">
            <div className="relative mt-2">
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="h-20 w-20 rounded-xl object-cover shadow-2xl border border-[#006837]/50"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-2 py-0.5 rounded-full text-[6px] font-black text-slate-950 uppercase shadow-xl">
                {player.recommendation}
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <h2 className="font-oswald text-xl font-bold uppercase text-white leading-tight">{player.name}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {player.position1} <span className="mx-1 text-slate-800">•</span> {player.club}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-1.5 w-full">
              {[
                { label: 'Rating', val: getRecLabel(player.recommendation) },
                { label: 'Avaliação', val: player.scoutYear, color: 'text-[#f1c40f]' },
                { label: 'Altura', val: `${player.height} cm` },
                { label: 'Pé', val: player.foot === 'Right' ? 'Destro' : 'Canhoto' }
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg bg-slate-950 p-2 border border-white/5 text-center">
                  <div className="text-[6px] text-slate-600 uppercase font-black mb-0.5">{item.label}</div>
                  <div className={`text-[9px] font-bold ${item.color || 'text-white'} truncate uppercase`}>{item.val}</div>
                </div>
              ))}
            </div>

            <div className="mt-2 h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 6, fontWeight: 800 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="#f1c40f" fill="#f1c40f" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DASHBOARD (DIREITA) */}
          <div className="md:col-span-7 p-6 flex flex-col h-full bg-[#050807]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#006837]/20 flex items-center justify-center text-[#f1c40f] text-sm border border-[#006837]/30">
                  <i className="fas fa-microchip"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-md font-bold uppercase text-white leading-none">Análise Performance IA</h3>
                  <p className="text-[6px] font-bold text-[#006837] uppercase tracking-[0.2em] mt-1">Scout Intel v6.2</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleFixKey}
                  className="text-[6px] font-black text-slate-500 hover:text-[#f1c40f] uppercase tracking-widest border border-white/10 px-2 py-1 rounded"
                >
                  <i className="fas fa-key mr-1"></i> Configurar IA
                </button>
              </div>
            </div>

            <div className={`rounded-xl border p-4 flex-1 flex flex-col justify-center min-h-0 ${
              hasData ? 'border-[#006837]/20 bg-emerald-950/5' : 'border-slate-800 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Sincronizando Atleta...</span>
                </div>
              ) : (
                <div className="overflow-y-auto custom-scrollbar pr-2">
                  <p className="text-[12px] leading-relaxed text-slate-200 italic font-medium">
                    {hasData ? `"${report}"` : report}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                 <span className="text-[7px] font-black text-[#006837] uppercase block mb-1">Status Observação</span>
                 <p className="text-[10px] text-slate-400">
                    Visto em <span className="text-white font-bold">{player.gamesWatched} Jogos</span> na <span className="text-[#f1c40f]">{player.competition}</span>.
                 </p>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                 <span className="text-[7px] font-black text-[#f1c40f] uppercase block mb-1">Staff / Contato</span>
                 <p className="text-[10px] text-slate-400 truncate">Agente: <span className="text-white font-bold">{player.agent || 'N/A'}</span></p>
                 <p className="text-[9px] text-slate-500 truncate">{player.contact || 'S/ Informação'}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a href={player.videoUrl} target="_blank" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-3 text-[8px] font-black text-white hover:bg-red-500 transition-all uppercase tracking-widest shadow-lg">
                <i className="fab fa-youtube"></i> Vídeo Scout
              </a>
              <a href={player.ogolUrl} target="_blank" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white py-3 text-[8px] font-black text-[#006837] hover:bg-slate-100 transition-all uppercase tracking-widest shadow-lg">
                <i className="fas fa-database"></i> Perfil oGol
              </a>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-center">
              <p className="text-[6px] text-slate-700 uppercase tracking-[0.3em]">
                Porto Vitória FC • Documento Interno • Analítico
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
