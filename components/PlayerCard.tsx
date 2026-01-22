
import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onClick: (player: Player) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  return (
    <div 
      onClick={() => onClick(player)}
      className="card-hover-effect group relative w-full bg-[#080b09] rounded-2xl overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
    >
      {/* Branding Header */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#006837] via-[#f1c40f] to-[#006837] z-30"></div>

      {/* Image Area */}
      <div className="relative h-72 w-full overflow-hidden">
        <img 
          src={player.photoUrl} 
          alt={player.name}
          loading="lazy"
          className="h-full w-full object-cover object-top filter contrast-[1.05] brightness-90 group-hover:scale-110 transition-transform duration-700" 
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b09] via-transparent to-[#080b09]/40 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#080b09]/60 via-transparent to-transparent z-10"></div>

        {/* Club Logo Badge */}
        <div className="absolute top-4 right-4 z-20 h-10 w-10 bg-white/95 backdrop-blur-md rounded-lg p-1.5 shadow-2xl border border-white/20 transform rotate-3 group-hover:rotate-0 transition-transform">
          <img 
            src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" 
            alt="Porto Vitória FC"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Recommendation Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`px-3 py-1 rounded border text-[9px] font-black uppercase tracking-[0.15em] shadow-xl backdrop-blur-md flex items-center gap-2 ${
            player.recommendation.includes('Elite') ? 'bg-[#f1c40f]/90 text-black border-[#f1c40f]' : 
            player.recommendation.includes('Titular') ? 'bg-[#006837]/90 text-white border-[#006837]' :
            'bg-slate-900/90 text-slate-300 border-white/10'
          }`}>
             <div className={`h-1.5 w-1.5 rounded-full ${player.recommendation.includes('Elite') ? 'bg-black animate-pulse' : 'bg-white'}`}></div>
             {player.recommendation}
          </div>
        </div>

        {/* Floating Background Text (Jogos instead of Position) */}
        <div className="absolute bottom-4 left-6 z-20">
          <span className="text-4xl font-oswald font-black text-white/10 uppercase tracking-tighter leading-none block">
            {player.gamesWatched} JGS
          </span>
        </div>
      </div>

      {/* Info Content */}
      <div className="px-6 pb-6 pt-2 relative z-20">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-oswald text-2xl font-bold uppercase text-white tracking-tight leading-tight group-hover:text-[#f1c40f] transition-colors truncate">
              {player.name}
            </h3>
            <p className="text-[10px] font-bold text-[#006837] uppercase tracking-widest mt-1">
              {player.club}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[14px] font-oswald font-bold text-white leading-none block">{player.age}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">ANOS</span>
          </div>
        </div>

        {/* Stats Strip - Updated: POSIÇÃO -> JOGOS */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 mb-4">
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">JOGOS</p>
            <p className="text-[10px] font-bold text-white uppercase">{player.gamesWatched}</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">PERNA</p>
            <p className="text-[10px] font-bold text-white uppercase">
              {player.foot === 'Right' ? 'DESTRO' : player.foot === 'Left' ? 'CANHOTO' : 'AMB'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">ALTURA</p>
            <p className="text-[10px] font-bold text-white uppercase">{player.height}cm</p>
          </div>
        </div>

        {/* Competition Footer - Updated: Show only Year */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <i className="fas fa-trophy text-[#f1c40f] text-[10px]"></i>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[120px]">
                {player.competition}
              </span>
           </div>
           <div className="bg-[#006837]/10 px-2 py-1 rounded text-[#006837] text-[8px] font-black uppercase">
             {player.scoutYear}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
