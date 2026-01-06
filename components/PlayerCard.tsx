
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
      case 'G1 Elite': return { border: 'border-[#f1c40f]', bg: 'bg-[#f1c40f]/10', text: 'text-[#f1c40f]', glow: 'shadow-[0_0_20px_rgba(241,196,15,0.15)]' };
      case 'G2 Titular': return { border: 'border-white/40', bg: 'bg-white/5', text: 'text-white', glow: 'shadow-none' };
      case 'G3 Monitoramento': return { border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-500', glow: 'shadow-none' };
      default: return { border: 'border-[#006837]/40', bg: 'bg-[#006837]/10', text: 'text-[#006837]', glow: 'shadow-none' };
    }
  };

  const styles = getRecStyles(player.recommendation);

  return (
    <div 
      onClick={() => onClick(player)}
      className={`group relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-[#0a0f0d] border ${styles.border} transition-all duration-500 hover:-translate-y-2 ${styles.glow} flex flex-col`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#006837]/10 blur-[50px] -z-10 group-hover:bg-[#f1c40f]/10 transition-colors"></div>
      
      {/* Top Section: Photo & Badge */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] to-transparent z-10"></div>
        <img 
          src={player.photoUrl} 
          alt={player.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Quality Badge */}
        <div className={`absolute top-4 left-6 z-20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${styles.border} ${styles.bg} ${styles.text}`}>
          {player.recommendation}
        </div>

        {/* Rating Hexagon-style */}
        <div className="absolute top-4 right-6 z-20 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1c40f] text-xl font-black text-black shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform">
            {averageRating}
          </div>
          <span className="mt-1 text-[7px] font-black uppercase text-white tracking-widest opacity-50">OVR</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 pb-6 pt-2 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-[#006837] uppercase tracking-widest">{player.position1}</span>
          <span className="h-1 w-1 rounded-full bg-slate-700"></span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{player.age} anos</span>
        </div>

        <h3 className="font-oswald text-xl font-bold uppercase text-white group-hover:text-[#f1c40f] transition-colors line-clamp-1">
          {player.name}
        </h3>
        
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight italic mb-4">
          {player.club}
        </p>

        {/* Stats Grid */}
        <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-3 gap-y-3">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase">Ritmo</span>
            <span className="text-xs font-bold text-white">{player.stats.pace}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase">Passe</span>
            <span className="text-xs font-bold text-white">{player.stats.passing}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase">Drible</span>
            <span className="text-xs font-bold text-white">{player.stats.dribbling}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase">Defesa</span>
            <span className="text-xs font-bold text-white">{player.stats.defending}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase">Físico</span>
            <span className="text-xs font-bold text-white">{player.stats.physical}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase">Finaliz.</span>
            <span className="text-xs font-bold text-white">{player.stats.shooting}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
