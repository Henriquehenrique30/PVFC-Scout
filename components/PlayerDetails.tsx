
import React, { useEffect, useState } from 'react';
import { Player, Recommendation } from '../types';
import { getScoutReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, onClose }) => {
  const [report, setReport] = useState<string>('Iniciando varredura de dados técnicos...');
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

  const averageRating = Math.round(
    (player.stats.pace + player.stats.shooting + player.stats.passing + 
     player.stats.dribbling + player.stats.defending + player.stats.physical) / 6
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-[#050807] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#006837]/30 max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#006837] text-white hover:bg-[#f1c40f] hover:text-black transition-all shadow-xl"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          
          {/* PAINEL LATERAL (ESQUERDA) */}
          <div className="md:col-span-4 p-8 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center overflow-y-auto custom-scrollbar">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#006837] to-[#f1c40f] rounded-3xl blur opacity-20 group-hover:opacity-40 transition"></div>
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="relative h-40 w-40 rounded-3xl object-cover border-2 border-[#006837]/30 shadow-2xl"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-4 py-1 rounded-full text-[9px] font-black text-slate-950 uppercase shadow-xl border-2 border-[#050807]">
                {player.recommendation}
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <h2 className="font-oswald text-3xl font-bold uppercase text-white leading-tight tracking-tight">{player.name}</h2>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="text-xs font-black text-[#006837] uppercase tracking-widest">{player.position1}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800"></span>
                <span className="text-xs text-slate-400 font-bold uppercase">{player.club}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 w-full">
              <div className="rounded-2xl bg-slate-900/50 p-3 border border-white/5 text-center">
                <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Overall</div>
                <div className="text-2xl font-black text-[#f1c40f]">{averageRating}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/50 p-3 border border-white/5 text-center">
                <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Idade</div>
                <div className="text-2xl font-black text-white">{player.age}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/50 p-3 border border-white/5 text-center">
                <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Altura</div>
                <div className="text-sm font-bold text-white">{player.height} cm</div>
              </div>
              <div className="rounded-2xl bg-slate-900/50 p-3 border border-white/5 text-center">
                <div className="text-[8px] text-slate-600 uppercase font-black mb-1">Pé</div>
                <div className="text-sm font-bold text-white">{player.foot === 'Right' ? 'Destro' : player.foot === 'Left' ? 'Canhoto' : 'Ambidestro'}</div>
              </div>
            </div>

            <div className="mt-6 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name={player.name}
                    dataKey="A"
                    stroke="#f1c40f"
                    fill="#f1c40f"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DASHBOARD PRINCIPAL (DIREITA) */}
          <div className="md:col-span-8 p-10 flex flex-col h-full bg-[#050807] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] text-2xl border border-[#006837]/20">
                  <i className="fas fa-microchip"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white tracking-wide">Relatório de Performance IA</h3>
                  <p className="text-[10px] font-black text-[#006837] uppercase tracking-[0.4em] mt-1">Sincronizado com Data Hub Porto Vitória</p>
                </div>
              </div>
              {hasData && (
                <div className="bg-[#f1c40f]/10 px-4 py-2 rounded-xl border border-[#f1c40f]/30">
                  <span className="text-[10px] font-black text-[#f1c40f] uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-check-double"></i> Planilha Ativa
                  </span>
                </div>
              )}
            </div>

            {/* BOX DE ANÁLISE IA */}
            <div className={`relative rounded-3xl border p-8 flex-grow transition-all ${
              hasData ? 'border-[#006837]/30 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-slate-800 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-xs font-black uppercase text-slate-600 tracking-[0.5em]">Processando Big Data...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="flex items-start gap-4 mb-6">
                    <i className="fas fa-quote-left text-4xl text-[#006837]/30"></i>
                    <p className="text-lg leading-relaxed text-slate-200 font-medium whitespace-pre-line">
                      {report}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* GRID DE INFORMAÇÕES SECUNDÁRIAS */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0a0f0d] p-6 rounded-3xl border border-white/5">
                 <h4 className="text-[10px] font-black text-[#006837] uppercase tracking-widest mb-4 flex items-center gap-2">
                   <i className="fas fa-eye"></i> Histórico de Campo
                 </h4>
                 <p className="text-sm text-slate-400">
                    O atleta foi monitorado presencialmente em <span className="text-white font-bold">{player.gamesWatched} partidas</span> oficiais pela competição <span className="text-[#f1c40f] font-bold">{player.competition}</span> em {player.scoutYear}.
                 </p>
              </div>

              <div className="bg-[#0a0f0d] p-6 rounded-3xl border border-white/5">
                 <h4 className="text-[10px] font-black text-[#f1c40f] uppercase tracking-widest mb-4 flex items-center gap-2">
                   <i className="fas fa-handshake"></i> Gestão de Carreira
                 </h4>
                 <div className="space-y-2">
                    <p className="text-sm text-slate-400 flex justify-between">
                      <span>Agente:</span>
                      <span className="text-white font-bold">{player.agent || 'Direto'}</span>
                    </p>
                    <p className="text-sm text-slate-400 flex justify-between">
                      <span>Contato:</span>
                      <span className="text-white font-mono">{player.contact || 'Não Disponível'}</span>
                    </p>
                 </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="mt-8 flex gap-4">
              {player.videoUrl && (
                <a 
                  href={player.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-xs font-black text-white hover:bg-red-500 transition-all shadow-xl uppercase tracking-widest"
                >
                  <i className="fab fa-youtube text-lg"></i> Assistir Vídeo Scout
                </a>
              )}
              {player.ogolUrl && (
                <a 
                  href={player.ogolUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-xs font-black text-[#006837] hover:bg-slate-100 transition-all shadow-xl uppercase tracking-widest border border-slate-200"
                >
                  <i className="fas fa-external-link-alt"></i> Ver Perfil Completo oGol
                </a>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[8px] text-slate-700 uppercase tracking-[0.4em] font-black">
                Porto Vitória Futebol Clube • Documento Analítico de Alta Confidencialidade
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
