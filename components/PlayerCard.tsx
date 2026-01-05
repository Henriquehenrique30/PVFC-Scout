
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

  const getRecColor = (rec: Recommendation) => {
    if (rec.startsWith('G1')) return 'bg-[#f1c40f] text-slate-950 shadow-[0_0_10px_rgba(241,196,15,0.4)]';
    if (rec.startsWith('G2')) return 'bg-white text-[#006837]';
    if (rec.startsWith('G3')) return 'bg-orange-500 text-white';
    if (rec === 'Base') return 'bg-[#006837] text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div 
      onClick={() => onClick(player)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#0f1a16] border border-[#006837]/20 transition-all hover:-translate-y-2 hover:border-[#f1c40f]/50 porto-glow shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#050807] via-transparent to-transparent opacity-90 z-10"></div>
      
      <div className="relative h-64 w-full overflow-hidden">
        <img 
          src={player.photoUrl} 
          alt={player.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
        />
        {/* Flag of Quality */}
        <div className={`absolute top-0 left-4 z-20 h-14 w-8 rounded-b-md flex flex-col items-center justify-center font-oswald font-bold ${getRecColor(player.recommendation)}`}>
            <span className="text-xs">{player.recommendation.split(' ')[0]}</span>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1c40f] text-xl font-bold text-slate-950 shadow-lg border border-white/20">
          {averageRating}
        </div>
        <span className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-white">Rating</span>
      </div>

      <div className="relative z-20 p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <span className="rounded-lg bg-[#006837]/30 border border-[#006837]/40 px-3 py-1 text-[9px] font-black text-white uppercase tracking-wider">
              {player.position1}{player.position2 ? ` / ${player.position2}` : ''}
            </span>
            <span className="text-[10px] font-bold text-[#f1c40f] uppercase tracking-widest">
              {player.age} Anos
            </span>
          </div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{player.scoutYear}</span>
        </div>
        
        <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight text-white line-clamp-1 group-hover:text-[#f1c40f] transition-colors">
          {player.name}
        </h3>
        
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 line-clamp-1 uppercase tracking-tighter">{player.club}</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#006837]/10 pt-4">
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">RITMO</div>
            <div className="text-xs font-bold text-white">{player.stats.pace}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">FINAL</div>
            <div className="text-xs font-bold text-white">{player.stats.shooting}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">PASSE</div>
            <div className="text-xs font-bold text-white">{player.stats.passing}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
