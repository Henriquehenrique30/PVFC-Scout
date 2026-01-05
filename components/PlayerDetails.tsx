
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
    
    // Fix: Use hasSelectedApiKey to check if user has selected an API key
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      setIsKeyMissing(true);
      setReport("POR FAVOR, SELECIONE UMA CHAVE API: Para realizar análises avançadas com o Gemini 3 Pro, você deve selecionar sua chave no painel.");
      setLoading(false);
      return;
    }

    try {
      const res = await getScoutReport(player);
      setReport(res);
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING') {
        setIsKeyMissing(true);
        setReport("CHAVE INVÁLIDA OU NÃO SELECIONADA: Por favor, selecione sua chave de API do Google AI Studio novamente.");
      } else {
        setReport("Erro ao carregar análise técnica. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [player]);

  const handleOpenConfig = async () => {
    // Fix: Use openSelectKey as instructed for Gemini 3 series models
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Proceed immediately to retry fetching after selection
      fetchReport();
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

  const averageRating = Math.round(
    (player.stats.pace + player.stats.shooting + player.stats.passing + 
     player.stats.dribbling + player.stats.defending + player.stats.physical) / 6
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl overflow-hidden">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[3rem] bg-[#050807] shadow-[0_0_100px_rgba(0,104,55,0.15)] border border-[#006837]/40 max-h-[94vh] flex flex-col animate-in fade-in zoom-in duration-500">
        
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 z-30 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/50 text-white hover:bg-red-600 transition-all border border-white/10 group shadow-2xl"
        >
          <i className="fas fa-times group-hover:rotate-90 transition-transform"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          
          <div className="md:col-span-4 p-10 bg-[#0a0f0d] border-r border-white/5 flex flex-col items-center overflow-y-auto custom-scrollbar">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#006837] via-[#f1c40f] to-[#006837] rounded-[2.5rem] blur-md opacity-20 group-hover:opacity-40 transition-all"></div>
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="relative h-56 w-56 rounded-[2.5rem] object-cover border-4 border-[#050807] shadow-2xl"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#f1c40f] px-6 py-2 rounded-full text-[10px] font-black text-slate-950 uppercase shadow-2xl border-4 border-[#0a0f0d] tracking-widest text-center min-w-[120px]">
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
                <div key={idx} className="rounded-2xl bg-slate-900/40 p-5 border border-white/5 text-center">
                  <div className="text-[9px] text-slate-600 uppercase font-black mb-1 tracking-widest">{item.label}</div>
                  <div className={`text-2xl font-black ${item.color || 'text-white'}`}>{item.val}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#006837" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 900 }} />
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

          <div className="md:col-span-8 p-14 flex flex-col h-full bg-[#050807] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/5">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-[#006837]/10 flex items-center justify-center text-[#f1c40f] text-3xl border border-[#006837]/30 shadow-inner">
                  <i className="fas fa-brain"></i>
                </div>
                <div>
                  <h3 className="font-oswald text-3xl font-bold uppercase text-white tracking-wide">Relatório Técnico IA</h3>
                  <p className="text-[11px] font-black text-[#006837] uppercase tracking-[0.5em] mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Gemini 3 Pro
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleOpenConfig}
                className={`flex items-center gap-3 transition-all px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-xl ${
                  isKeyMissing 
                  ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                  : 'bg-slate-900/80 hover:bg-[#f1c40f] hover:text-black text-white border-white/10'
                }`}
              >
                <i className="fas fa-key"></i> {isKeyMissing ? 'Selecionar Chave' : 'Configurar Chave'}
              </button>
            </div>

            <div className={`relative rounded-[3rem] border p-12 flex-grow transition-all flex flex-col shadow-2xl ${
              hasData ? 'border-[#006837]/30 bg-gradient-to-br from-[#0a0f0d] to-transparent' : 'border-slate-800 bg-slate-900/10'
            }`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-8 py-20">
                  <div className="h-16 w-16 animate-spin rounded-full border-[6px] border-[#f1c40f] border-t-transparent shadow-[0_0_30px_rgba(241,196,15,0.2)]"></div>
                  <div className="text-center">
                    <span className="text-sm font-black uppercase text-white tracking-[0.6em] block mb-2">Analisando Scouting</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Processando Big Data da Planilha...</span>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-y-auto custom-scrollbar pr-6">
                  <i className="fas fa-quote-left text-7xl text-[#006837]/10 absolute -top-6 -left-4"></i>
                  <div className="relative z-10">
                    <p className={`text-xl leading-relaxed font-medium whitespace-pre-line tracking-tight ${isKeyMissing ? 'text-red-400 italic' : 'text-slate-100'}`}>
                      {report}
                    </p>
                    {isKeyMissing && (
                      <div className="mt-10 p-6 bg-red-600/10 rounded-2xl border border-red-500/20 text-center">
                         <p className="text-xs text-red-500 font-bold uppercase mb-4">Ação Necessária:</p>
                         <p className="text-[11px] text-slate-300 uppercase mb-4">
                           Clique no botão "Selecionar Chave" acima e escolha uma chave de API válida com faturamento ativado para usar o Gemini 3 Pro.
                         </p>
                         <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#f1c40f] underline uppercase">Ver documentação de faturamento</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-12 flex gap-6">
              {player.videoUrl && (
                <a href={player.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-4 rounded-3xl bg-red-600 px-8 py-6 text-sm font-black text-white hover:bg-red-500 transition-all shadow-2xl uppercase tracking-widest">
                  <i className="fab fa-youtube text-2xl"></i> Vídeo
                </a>
              )}
              {player.ogolUrl && (
                <a href={player.ogolUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-4 rounded-3xl bg-white px-8 py-6 text-sm font-black text-[#006837] hover:bg-slate-100 transition-all shadow-2xl uppercase tracking-widest border border-slate-200">
                  <i className="fas fa-database text-lg"></i> oGol
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
