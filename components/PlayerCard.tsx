
import React from 'react';
import { Player } from '../types';

// Force update: v2.2 - Reduced card height for better image quality
interface PlayerCardProps {
  player: Player;
  onClick: (player: Player) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  
  const averageRating = Math.round(
    (player.stats.pace + player.stats.shooting + player.stats.passing + 
     player.stats.dribbling + player.stats.defending + player.stats.physical) / 6
  );

  return (
    <div 
      onClick={() => onClick(player)}
      className="group relative w-full bg-[#0a0f0d] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#f1c40f]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(241,196,15,0.1)] cursor-pointer"
    >
      {/* --- ÁREA DA FOTO (REDUZIDA DE h-80 PARA h-64) --- */}
      <div className="relative h-64 w-full bg-[#1a1d1c]">
        
        <img 
          src={player.photoUrl} 
          alt={player.name}
          loading="lazy"
          // Mantendo o foco nos olhos/rosto para fotos com aspect ratio diferente
          style={{ objectPosition: '50% 15%' }}
          className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
        />
        
        {/* Degradê inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-[#0a0f0d]/20 to-transparent"></div>

        {/* Badge: Recomendação */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 ${
            player.recommendation.includes('Elite') ? 'bg-[#f1c40f] text-black border-[#f1c40f]' : 
            player.recommendation.includes('Titular') ? 'bg-[#006837] text-white border-[#006837]' :
            'bg-slate-900/90 text-slate-400 border-white/10'
          }`}>
             <span className={`h-1.5 w-1.5 rounded-full ${player.recommendation.includes('Elite') ? 'bg-black animate-pulse' : 'bg-white'}`}></span>
             {player.recommendation}
          </div>
        </div>

        {/* Badge: Rating */}
        <div className="absolute top-4 right-4">
          <div className="h-10 w-10 rounded-xl bg-[#f1c40f] flex flex-col items-center justify-center shadow-lg border-2 border-[#f1c40f] group-hover:scale-110 transition-transform">
             <span className="text-lg font-black text-black leading-none">{averageRating}</span>
             <span className="text-[6px] font-bold text-black/60 uppercase tracking-widest">Rating</span>
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO DO CARD --- */}
      <div className="relative px-6 pb-6 -mt-8">
        
        <div className="mb-6">
           <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-[#006837] text-white text-[9px] font-black uppercase tracking-wider">{player.position1}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase">{player.age} Anos</span>
              <span className="text-[9px] font-black text-slate-500 uppercase border-l border-white/10 pl-2">{player.height}cm</span>
           </div>
           <h3 className="font-oswald text-2xl font-bold uppercase text-white leading-none mb-1 group-hover:text-[#f1c40f] transition-colors">{player.name}</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{player.club}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
           {player.competition && (
             <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[8px] font-bold text-[#f1c40f] uppercase tracking-wider flex items-center gap-1.5">
                <i className="fas fa-trophy text-[8px]"></i> {player.competition}
             </div>
           )}
           <div className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="far fa-calendar text-[8px]"></i> {player.scoutYear}
           </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
           {[
             { l: 'RITMO', v: player.stats.pace },
             { l: 'PASSE', v: player.stats.passing },
             { l: 'DRIBLE', v: player.stats.dribbling },
             { l: 'DEFESA', v: player.stats.defending },
             { l: 'FÍSICO', v: player.stats.physical },
             { l: 'FINAL', v: player.stats.shooting },
           ].map((stat, i) => (
             <div key={i}>
                <div className="flex justify-between items-end mb-1">
                   <span className="text-[7px] font-black text-slate-600 uppercase tracking-wider">{stat.l}</span>
                   <span className="text-[9px] font-bold text-white">{stat.v}</span>
                </div>
                <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className={`h-full rounded-full ${stat.v >= 4 ? 'bg-[#006837]' : stat.v === 3 ? 'bg-[#f1c40f]' : 'bg-red-500'}`} 
                     style={{ width: `${(stat.v / 5) * 100}%` }}
                   ></div>
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
};

export default PlayerCard;
