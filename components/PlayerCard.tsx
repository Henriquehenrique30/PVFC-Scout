
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
      className="group relative w-full bg-[#0a0f0d] rounded-[2rem] overflow-hidden border border-white/5 hover:border-[#f1c40f]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(241,196,15,0.1)] cursor-pointer"
    >
      {/* --- ÁREA DA FOTO (REDUZIDA PARA h-56 PARA MAIOR COMPACIDADE) --- */}
      <div className="relative h-56 w-full bg-[#1a1d1c]">
        <img 
          src={player.photoUrl} 
          alt={player.name}
          loading="lazy"
          style={{ objectPosition: '50% 15%' }}
          className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
        />
        
        {/* Degradê inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-[#0a0f0d]/10 to-transparent"></div>

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
      </div>

      {/* --- CONTEÚDO DO CARD --- */}
      <div className="relative px-6 pb-6 -mt-10">
        <div className="mb-4">
           <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-[#006837] text-white text-[9px] font-black uppercase tracking-wider">{player.position1}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase">{player.age} Anos</span>
              <span className="text-[9px] font-black text-slate-500 uppercase border-l border-white/10 pl-2">
                {player.foot === 'Right' ? 'Destro' : player.foot === 'Left' ? 'Canhoto' : 'Ambi.'}
              </span>
           </div>
           <h3 className="font-oswald text-xl font-bold uppercase text-white leading-none mb-1 group-hover:text-[#f1c40f] transition-colors">{player.name}</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{player.club}</p>
        </div>

        {/* GRID DE INFO: Competição, Ano e Jogos Vistos */}
        <div className="flex flex-wrap gap-1.5">
           {player.competition && (
             <div className="px-2 py-1 rounded border border-white/5 bg-white/5 text-[7px] font-bold text-[#f1c40f] uppercase tracking-wider flex items-center gap-1">
                <i className="fas fa-trophy text-[7px]"></i> {player.competition}
             </div>
           )}
           <div className="px-2 py-1 rounded border border-white/5 bg-white/5 text-[7px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <i className="far fa-calendar text-[7px]"></i> {player.scoutYear}
           </div>
           <div className="px-2 py-1 rounded border border-white/5 bg-[#006837]/10 text-[7px] font-bold text-[#006837] uppercase tracking-wider flex items-center gap-1">
              <i className="fas fa-eye text-[7px]"></i> {player.gamesWatched} Jogos
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
