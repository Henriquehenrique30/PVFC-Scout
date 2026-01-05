
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/98 backdrop-blur-xl overflow-hidden">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[3rem] bg-[#050807] shadow-[0_0_80px_rgba(0,104,55,0.2)] border border-[#006837]/40 max-h-[94vh] flex flex-col animate-in fade-in zoom-in duration-500">
        
        {/* Botão de Fechar Estilizado */}
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 z-30 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/50 text-white hover:bg-red-600 transition-all border border-white/10 group"
        >
          <i className="fas fa-times group-hover:rotate-90 transition-transform"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          
          {/* LADO ESQUERDO: PERFIL DO ATLETA (33%) */}
          <div className="md:col-span-4 p-10 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center overflow-y-auto custom-scrollbar">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#006837] via-[#f1c40f] to-[#006837] rounded-[2.5rem] blur-md opacity-20 group-hover:opacity-40 transition-all"></div>
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="relative h-52 w-52 rounded-[2rem] object-cover border-4 border-[#050807] shadow-2xl"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-6 py-1.5 rounded-full text-[10px] font-black text-slate-950 uppercase shadow-2xl border-4 border-[#0a0f0d] tracking-widest">
                {player.recommendation}
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <h2 className="font-oswald text-4xl font-bold uppercase text-white tracking-tighter leading-none">{player.name}</h2>
              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="text-sm font-black text-[#006837] uppercase tracking-[0.3em]">{player.position1}</span>
                <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                <span className="text-sm text-slate-400 font-bold uppercase">{player.club}</span>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 w-full">
              {[
                { label: 'OVR', val: averageRating, color: 'text-[#f1c40f]' },
                { label: 'AVALIAÇÃO', val: player.scoutYear },
                { label: 'IDADE', val: player.age },
                { label: 'ALTURA', val: `${player.height} cm` }
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl bg-slate-900/40 p-4 border border-white/5 text-center">
                  <div className="text-[9px] text-slate-600 uppercase font-black mb-1 tracking-widest">{item.label}</div>
                  <div className={`text-xl font-black ${item.color || 'text-white'}`}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Radar Chart Maior */}
            <div className="mt-8 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }} />
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

          {/* LADO DIREITO: DASHBOARD ANALÍTICO (66%) */}
          <div className="md:col-span-8 p-12 flex flex-col h-full bg-[#050807] overflow-y-auto custom-scrollbar">
            
            {/* Header de Performance */}
            <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/5">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] text-3xl border border-[#006837]/30 shadow-inner">
                  <i className="fas fa-brain"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-3xl font-bold uppercase text-white tracking-wide">Análise de Performance PRO</h3>
                  <p className="text-[11px] font-black text-[#006837] uppercase tracking-[0.5em] mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Módulo de Inteligência de Mercado v7.0
                  </p>
                </div>
              </div>
              
              {hasData && (
                <div className="hidden lg:flex items-center gap-4 bg-[#f1c40f]/10 px-6 py-3 rounded-2xl border border-[#f1c40f]/20">
                  <i className="fas fa-file-excel text-[#f1c40f] text-xl"></i>
                  <div>
                    <span className="text-[9px] font-black text-[#f1c40f] uppercase block tracking-tighter">Planilha Analisada</span>
                    <span className="text-[10px] text-white font-bold uppercase">Métricas Oficiais Carregadas</span>
                  </div>
                </div>
              )}
            </div>

            {/* RELATÓRIO DA IA (GRANDE E CENTRAL) */}
            <div className={`relative rounded-[2.5rem] border p-10 flex-grow transition-all flex flex-col ${
              hasData ? 'border-[#006837]/30 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-slate-800 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#f1c40f] border-t-transparent shadow-[0_0_20px_rgba(241,196,15,0.2)]"></div>
                  <div className="text-center">
                    <span className="text-xs font-black uppercase text-white tracking-[0.6em] block mb-2">Processando Big Data</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Extraindo padrões da planilha Excel...</span>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-y-auto custom-scrollbar pr-4">
                  <i className="fas fa-quote-left text-6xl text-[#006837]/10 absolute -top-4 -left-2"></i>
                  <div className="relative z-10">
                    <p className="text-xl leading-relaxed text-slate-100 font-medium whitespace-pre-line">
                      {report}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* INFORMAÇÕES DE SCOUT E MERCADO */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0a0f0d] p-8 rounded-[2rem] border border-white/5 shadow-xl">
                 <h4 className="text-[11px] font-black text-[#006837] uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                   <i className="fas fa-stadium"></i> Monitoramento de Campo
                 </h4>
                 <p className="text-base text-slate-400 leading-relaxed">
                    O atleta foi acompanhado em <span className="text-white font-black underline decoration-[#006837] decoration-2 underline-offset-4">{player.gamesWatched} partidas</span> na <span className="text-[#f1c40f] font-black">{player.competition}</span>.
                 </p>
              </div>

              <div className="bg-[#0a0f0d] p-8 rounded-[2rem] border border-white/5 shadow-xl">
                 <h4 className="text-[11px] font-black text-[#f1c40f] uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                   <i className="fas fa-briefcase"></i> Negociações e Contato
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-600 block uppercase font-black">Agente</span>
                      <span className="text-white font-bold">{player.agent || 'Negociação Direta'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-600 block uppercase font-black">Contato</span>
                      <span className="text-white font-mono">{player.contact || 'N/A'}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO PREMIUM */}
            <div className="mt-10 flex gap-6">
              {player.videoUrl && (
                <a 
                  href={player.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-red-600 px-8 py-5 text-sm font-black text-white hover:bg-red-500 hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(220,38,38,0.2)] uppercase tracking-widest"
                >
                  <i className="fab fa-youtube text-2xl"></i> Assistir Vídeo Scout
                </a>
              )}
              {player.ogolUrl && (
                <a 
                  href={player.ogolUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-4 rounded-2xl bg-white px-8 py-5 text-sm font-black text-[#006837] hover:bg-slate-100 hover:scale-[1.02] transition-all shadow-xl uppercase tracking-widest border border-slate-200"
                >
                  <i className="fas fa-external-link-alt text-lg"></i> Perfil Oficial oGol
                </a>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] text-slate-700 uppercase tracking-[0.6em] font-black">
                PORTO VITÓRIA FC • DEPARTAMENTO DE INTELIGÊNCIA E MERCADO • DOCUMENTO SIGILOSO
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
