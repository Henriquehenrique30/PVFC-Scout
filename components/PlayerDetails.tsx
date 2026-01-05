
import React, { useEffect, useState } from 'react';
import { Player, Recommendation } from '../types';
import { getScoutReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, onClose }) => {
  const [report, setReport] = useState<string>('Iniciando processamento tático...');
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
      case 'G1 Elite': return 'Prioridade Estratégica Porto Vitória';
      case 'G2 Titular': return 'Potencial de Titularidade Absoluta';
      case 'G3 Monitoramento': return 'Ativo em Observação Periódica';
      case 'Base': return 'Projeção para Categoria de Base';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#0f1a16] shadow-2xl border border-[#006837]/30">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#006837] text-white hover:bg-[#f1c40f] hover:text-slate-950 transition-all shadow-lg"
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[80vh]">
          {/* LADO ESQUERDO: PERFIL VISUAL */}
          <div className="md:col-span-5 p-10 bg-gradient-to-br from-[#0a0f0d] to-[#0f1a16]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img 
                  src={player.photoUrl} 
                  alt={player.name} 
                  className="h-48 w-48 rounded-3xl object-cover shadow-2xl border-4 border-[#006837]/50"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-6 py-1 rounded-full text-[10px] font-black text-slate-950 uppercase shadow-xl">
                  {player.recommendation}
                </div>
              </div>
              
              <div className="mt-10">
                <h2 className="font-oswald text-5xl font-bold uppercase text-white leading-tight">{player.name}</h2>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="text-md font-bold text-[#f1c40f] uppercase tracking-widest">{player.position1}{player.position2 ? ` / ${player.position2}` : ''}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600"></span>
                  <span className="text-md text-slate-400 font-semibold">{player.club}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-900/50 p-5 border border-[#006837]/20">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Status Mercado</div>
                <div className="text-sm font-bold text-white">{getRecLabel(player.recommendation)}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/50 p-5 border border-[#006837]/20">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Ano Scout</div>
                <div className="text-lg font-bold text-[#f1c40f]">{player.scoutYear}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/50 p-5 border border-[#006837]/20">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Altura</div>
                <div className="text-lg font-bold text-white">{player.height} cm</div>
              </div>
              <div className="rounded-2xl bg-slate-900/50 p-5 border border-[#006837]/20">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Pé Dominante</div>
                <div className="text-lg font-bold text-white">{getFootLabel(player.foot)}</div>
              </div>
            </div>

            <div className="mt-10 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
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

          {/* LADO DIREITO: ANÁLISE TÉCNICA */}
          <div className="md:col-span-7 p-10 bg-[#050807] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#006837]/20 flex items-center justify-center text-[#f1c40f] text-2xl border border-[#006837]/30">
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white tracking-wide">Análise de Performance IA</h3>
                  <p className="text-[10px] font-bold text-[#006837] uppercase tracking-[0.3em]">Scout Pro Intel v6.0</p>
                </div>
              </div>
              {hasData && (
                <div className="flex items-center gap-2 bg-[#f1c40f]/10 px-3 py-1.5 rounded-lg border border-[#f1c40f]/20">
                  <i className="fas fa-certificate text-[#f1c40f] text-[10px]"></i>
                  <span className="text-[9px] font-black text-[#f1c40f] uppercase tracking-widest">Base de Dados Certificada</span>
                </div>
              )}
            </div>

            <div className={`rounded-3xl border p-8 transition-all ${
              hasData 
                ? 'border-[#006837]/30 bg-gradient-to-br from-[#006837]/10 to-transparent' 
                : 'border-orange-500/20 bg-orange-500/5'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f1c40f] border-t-transparent"></div>
                  <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Processando Big Data...</span>
                </div>
              ) : (
                <div className="flex gap-6">
                  {!hasData && <i className="fas fa-exclamation-triangle text-orange-500 text-2xl mt-1 shrink-0"></i>}
                  <p className={`text-lg leading-relaxed font-medium ${
                    hasData ? 'text-slate-100 italic' : 'text-orange-200/80 font-bold'
                  }`}>
                    {hasData ? `"${report}"` : report}
                  </p>
                </div>
              )}
            </div>

            {!hasData && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-white/5 flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 bg-[#006837]/20 rounded-lg flex items-center justify-center text-[#006837]">
                   <i className="fas fa-upload"></i>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                  Dica: Anexe o relatório de scout (Excel ou CSV) no cadastro para que a IA possa realizar cruzamento de dados métricos e gerar um perfil tático assertivo.
                </p>
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] flex items-center gap-3">
                  <span className="h-px w-8 bg-[#006837]"></span> Registros do Analista
                </h4>
                <div className="rounded-2xl bg-slate-900/40 p-6 border border-white/5 h-full">
                    <span className="text-[10px] font-black text-[#006837] uppercase block mb-2">Monitoramento</span>
                    <p className="text-sm text-slate-300">Observado em <span className="text-white font-bold">{player.gamesWatched} partidas</span> na competição <span className="text-[#f1c40f]">{player.competition}</span>.</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-[0.4em] flex items-center gap-3">
                  <span className="h-px w-8 bg-[#f1c40f]"></span> Gestão de Carreira
                </h4>
                <div className="rounded-2xl bg-slate-900/40 p-6 border border-white/5 h-full">
                    <div className="mb-4">
                      <span className="text-[10px] font-black text-[#f1c40f] uppercase block mb-1">Agente / Empresa</span>
                      <p className="text-sm text-white font-bold">{player.agent || 'Nenhum informado'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[#006837] uppercase block mb-1">Informações de Contato</span>
                      <p className="text-sm text-slate-300">{player.contact || 'Não disponível'}</p>
                    </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              {player.videoUrl && (
                <a 
                  href={player.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-5 text-xs font-black text-white hover:bg-red-500 transition-all shadow-xl shadow-red-600/20 uppercase tracking-widest"
                >
                  <i className="fab fa-youtube text-lg"></i> Vídeo de Scout
                </a>
              )}
              {player.ogolUrl && (
                <a 
                  href={player.ogolUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-5 text-xs font-black text-[#006837] hover:bg-slate-100 transition-all shadow-xl shadow-white/5 uppercase tracking-widest border border-slate-200"
                >
                  <i className="fas fa-database text-lg"></i> Perfil oGol
                </a>
              )}
            </div>

            <div className="mt-16 text-center border-t border-white/5 pt-8">
              <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">
                Documento Interno - Confidencial - Porto Vitória Futebol Clube
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails;
