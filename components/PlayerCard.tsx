
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
    if (rec.startsWith('G1')) return 'bg-[#f1c40f] text-slate-950 shadow-[0_0_15px_rgba(241,196,15,0.5)]';
    if (rec.startsWith('G2')) return 'bg-white text-[#006837]';
    if (rec.startsWith('G3')) return 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]';
    if (rec === 'Base') return 'bg-[#006837] text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div 
      onClick={() => onClick(player)}
      className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-[#0f1a16] border border-[#006837]/20 transition-all duration-500 hover:-translate-y-3 hover:border-[#f1c40f]/60 porto-glow shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#050807] via-transparent to-transparent opacity-95 z-10"></div>
      
      <div className="relative h-72 w-full overflow-hidden">
        <img 
          src={player.photoUrl} 
          alt={player.name} 
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-85 group-hover:opacity-100"
        />
        {/* Flag of Quality */}
        <div className={`absolute top-0 left-6 z-20 h-16 w-10 rounded-b-xl flex flex-col items-center justify-center font-oswald font-black ${getRecColor(player.recommendation)}`}>
            <span className="text-[10px] uppercase">{player.recommendation.split(' ')[0]}</span>
        </div>

        {/* Scout Indicator */}
        <div className="absolute top-6 right-6 z-20 flex flex-col items-end">
           <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
              <span className="text-[9px] font-black text-[#f1c40f] uppercase tracking-tighter">{player.scoutYear}</span>
           </div>
        </div>
      </div>

      <div className="absolute right-6 top-52 z-20 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1c40f] text-2xl font-black text-slate-950 shadow-xl border border-white/30 transform group-hover:rotate-6 transition-transform">
          {averageRating}
        </div>
        <span className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-white">Rating</span>
      </div>

      <div className="relative z-20 p-6 -mt-10">
        <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg bg-[#006837] px-3 py-1 text-[9px] font-black text-white uppercase tracking-wider">
              {player.position1}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {player.age} Anos
            </span>
            <div className="flex items-center gap-1 ml-auto text-slate-500">
               <i className="fas fa-eye text-[10px]"></i>
               <span className="text-[9px] font-black">{player.gamesWatched}</span>
            </div>
        </div>
        
        <h3 className="font-oswald text-2xl font-bold uppercase tracking-tight text-white line-clamp-1 group-hover:text-[#f1c40f] transition-colors mb-1">
          {player.name}
        </h3>
        
        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight line-clamp-1 italic">
          {player.club}
        </p>

        <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase">Pé Dominante</span>
              <span className="text-[10px] font-bold text-white uppercase">{player.foot === 'Right' ? 'Destro' : player.foot === 'Left' ? 'Canhoto' : 'Ambidestro'}</span>
           </div>
           <div className="flex gap-4">
              <div className="text-center">
                <div className="text-[8px] font-black text-slate-600 uppercase">Vel</div>
                <div className="text-[11px] font-black text-white">{player.stats.pace}</div>
              </div>
              <div className="text-center">
                <div className="text-[8px] font-black text-slate-600 uppercase">Téc</div>
                <div className="text-[11px] font-black text-white">{player.stats.passing}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
