
import React from 'react';
import { Player, Position } from '../types';

interface PlayerCardProps {
  player: Player;
  onClick: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, onEdit, onDelete }) => {
  // Cores exclusivas e estilizadas por posição para máxima distinção visual
  const getPositionStyles = (pos: string) => {
    switch (pos) {
      case Position.GOL:
        return 'text-slate-400 border-slate-400/30 bg-slate-400/5';
      case Position.ZAG:
        return 'text-blue-500 border-blue-500/30 bg-blue-500/5';
      case Position.LTD:
        return 'text-sky-400 border-sky-400/30 bg-sky-400/5';
      case Position.LTE:
        return 'text-indigo-400 border-indigo-400/30 bg-indigo-400/5';
      case Position.VOL:
        return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5';
      case Position.MEI:
        return 'text-[#f1c40f] border-[#f1c40f]/30 bg-[#f1c40f]/5';
      case Position.EXT:
        return 'text-orange-500 border-orange-500/30 bg-orange-500/5';
      case Position.ATA:
        return 'text-red-500 border-red-500/30 bg-red-500/5';
      default:
        return 'text-[#006837] border-[#006837]/30 bg-[#006837]/5';
    }
  };

  return (
    <div 
      onClick={() => onClick(player)}
      className="card-hover-effect group relative w-full bg-[#080b09] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
    >
      {/* Action Buttons (Top Left) */}
      <div className="absolute top-6 left-6 z-40 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(player); }}
          className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-[#f1c40f] hover:text-black transition-all flex items-center justify-center shadow-lg"
          title="Editar Atleta"
        >
          <i className="fas fa-edit text-xs"></i>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(player.id); }}
          className="h-10 w-10 rounded-xl bg-red-600/20 backdrop-blur-md border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-lg"
          title="Excluir Atleta"
        >
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>

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
        {/* Header Content with Enhanced Position Badge and Games Watched */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border backdrop-blur-sm transition-colors ${getPositionStyles(player.position1)}`}>
            {player.position1}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/5">
            <i className="far fa-eye text-[10px] text-slate-600"></i>
            {player.gamesWatched}
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-oswald text-xl font-bold uppercase text-white tracking-tight leading-none group-hover:text-[#f1c40f] transition-colors truncate">
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
