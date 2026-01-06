
import React from 'react';
import { Player, Recommendation } from '../types';

interface PlayerCardProps {
  player: Player;
  onClick: (player: Player) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  const averageRating = Math.round(
    (player.stats.pace +
      player.stats.shooting +
      player.stats.passing +
      player.stats.dribbling +
      player.stats.defending +
      player.stats.physical) / 6
  );

  const getRecStyles = (rec: Recommendation) => {
    switch(rec) {
      case 'G1 Elite': return { border: 'border-[#f1c40f]/50', bg: 'bg-[#f1c40f]/5', text: 'text-[#f1c40f]', dot: 'bg-[#f1c40f]' };
      case 'G2 Titular': return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', dot: 'bg-emerald-500' };
      case 'G3 Monitoramento': return { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', dot: 'bg-blue-500' };
      default: return { border: 'border-slate-700/30', bg: 'bg-slate-800/5', text: 'text-slate-400', dot: 'bg-slate-500' };
    }
  };

  const styles = getRecStyles(player.recommendation);

  return (
    <div 
      onClick={() => onClick(player)}
      className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-[#0a0f0d]/80 border border-white/5 transition-all duration-500 hover:border-[#006837]/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col"
    >
      {/* Top HUD Area */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#006837]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative h-60 overflow-hidden">
        {/* Photo with Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-transparent to-black/20 z-10"></div>
        <img 
          src={player.photoUrl} 
          alt={player.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
        />
        
        {/* Quality Indicator */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/5">
          <div className={`h-1.5 w-1.5 rounded-full ${styles.dot} animate-pulse`}></div>
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${styles.text}`}>{player.recommendation}</span>
        </div>

        {/* Technical Score */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
          <div className="bg-[#f1c40f] h-10 w-10 rounded-xl flex items-center justify-center text-lg font-black text-black shadow-2xl">
            {averageRating}
          </div>
          <span className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1 mr-1">Rating</span>
        </div>
      </div>

      {/* Profile Data */}
      <div className="p-6 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-0.5 rounded bg-[#006837]/20 border border-[#006837]/30 text-[9px] font-black text-[#006837] uppercase tracking-widest">
            {player.position1}
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{player.age}y</span>
          <span className="h-1 w-1 rounded-full bg-slate-800"></span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{player.height}cm</span>
        </div>

        <h3 className="font-oswald text-2xl font-bold uppercase text-white group-hover:text-[#f1c40f] transition-colors leading-tight">
          {player.name}
        </h3>
        
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
          {player.club}
        </p>

        {/* Metric Grid - High Contrast */}
        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-y-4">
          {[
            { label: 'Ritmo', val: player.stats.pace },
            { label: 'Passe', val: player.stats.passing },
            { label: 'Drible', val: player.stats.dribbling },
            { label: 'Defesa', val: player.stats.defending },
            { label: 'Físico', val: player.stats.physical },
            { label: 'Final.', val: player.stats.shooting },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">{stat.label}</span>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-white">{stat.val}</span>
                 <div className="h-0.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#006837]" style={{ width: `${(stat.val/5)*100}%` }}></div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer "Scan" Effect */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#f1c40f] opacity-0 group-hover:opacity-40 shadow-[0_0_10px_#f1c40f] transition-opacity"></div>
    </div>
  );
};

export default PlayerCard;
