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
      className="card-hover-effect group relative w-full bg-[#080b09] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
    >
      {/* Branding Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#006837] via-[#f1c40f] to-[#006837] z-30"></div>

      {/* Image Area */}
      <div className="relative h-80 w-full overflow-hidden">
        <img 
          src={player.photoUrl} 
          alt={player.name}
          loading="lazy"
          className="h-full w-full object-cover object-top filter contrast-[1.1] brightness-90 group-hover:scale-110 transition-transform duration-1000" 
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b09] via-transparent to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all z-10"></div>

        {/* Club Logo Badge */}
        <div className="absolute top-6 right-6 z-20 h-12 w-12 bg-white rounded-2xl p-2 shadow-2xl border border-white/10 transform rotate-3 group-hover:rotate-0 transition-transform">
          <img 
            src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" 
            alt="Porto Vitória FC"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Status Badges */}
        <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
          <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-xl flex items-center gap-2 ${
            player.recommendation.includes('Elite') ? 'bg-[#f1c40f] text-black border-black/10' : 
            player.recommendation.includes('Titular') ? 'bg-[#006837] text-white border-white/10' :
            'bg-slate-900/90 text-slate-300 border-white/10'
          }`}>
             <div className={`h-1.5 w-1.5 rounded-full ${player.recommendation.includes('Elite') ? 'bg-black animate-pulse' : 'bg-white'}`}></div>
             {player.recommendation}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-8 pt-4 relative z-20 bg-gradient-to-b from-transparent to-black/40">
        <div className="flex justify-between items-end mb-6">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mb-1">{player.position1}</div>
            <h3 className="font-oswald text-[24px] font-bold uppercase text-white tracking-tight leading-none group-hover:text-[#f1c40f] transition-colors truncate">
              {player.name}
            </h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              {player.club}
            </p>
          </div>
          <div className="text-right pl-4">
            <span className="text-[20px] font-oswald font-black text-white leading-none block">{player.age}</span>
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ANOS</span>
          </div>
        </div>

        {/* Secondary Stats Strip */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">ALTURA</p>
            <p className="text-[11px] font-bold text-white">{player.height}cm</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">PERNA</p>
            <p className="text-[11px] font-bold text-white">
              {player.foot === 'Right' ? 'DESTRO' : player.foot === 'Left' ? 'CANHOTO' : 'AMB'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">SCOUT</p>
            <p className="text-[11px] font-bold text-white">{player.scoutYear}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;