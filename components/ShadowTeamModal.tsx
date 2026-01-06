import React, { useState, useEffect } from 'react';
import { Player, Position } from '../types';

interface ShadowTeamModalProps {
  players: Player[];
  onClose: () => void;
}

// Mapeamento das posições no campo (Coordenadas % Top/Left)
const FORMATION_SLOTS = [
  { id: 'gol', label: 'GOL', top: '88%', left: '50%' },
  { id: 'zag1', label: 'ZAG', top: '72%', left: '38%' },
  { id: 'zag2', label: 'ZAG', top: '72%', left: '62%' },
  { id: 'lte', label: 'LTE', top: '68%', left: '12%' },
  { id: 'ltd', label: 'LTD', top: '68%', left: '88%' },
  { id: 'vol1', label: 'VOL', top: '50%', left: '38%' },
  { id: 'vol2', label: 'VOL', top: '50%', left: '62%' },
  { id: 'mei', label: 'MEI', top: '35%', left: '50%' },
  { id: 'ext_esq', label: 'EXT', top: '20%', left: '15%' },
  { id: 'ext_dir', label: 'EXT', top: '20%', left: '85%' },
  { id: 'ata', label: 'ATA', top: '10%', left: '50%' },
];

const ShadowTeamModal: React.FC<ShadowTeamModalProps> = ({ players, onClose }) => {
  // Estado para armazenar quem está em qual posição { 'gol': playerId, ... }
  const [squad, setSquad] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pvfc_shadow_team');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Salva automaticamente sempre que o time muda
  useEffect(() => {
    localStorage.setItem('pvfc_shadow_team', JSON.stringify(squad));
  }, [squad]);

  const handleSelectPlayer = (playerId: string) => {
    if (selectingSlot) {
      setSquad(prev => ({ ...prev, [selectingSlot]: playerId }));
      setSelectingSlot(null);
      setSearch('');
    }
  };

  const handleRemovePlayer = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    const newSquad = { ...squad };
    delete newSquad[slotId];
    setSquad(newSquad);
  };

  const getPlayerInSlot = (slotId: string) => {
    const id = squad[slotId];
    return players.find(p => p.id === id);
  };

  // Filtra jogadores para seleção (excluindo os já escalados)
  const availablePlayers = players.filter(p => {
    const isAlreadySelected = Object.values(squad).includes(p.id);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.position1.toLowerCase().includes(search.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0a0f0d] border border-[#006837]/30 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* CABEÇALHO MOBILE / BOTÃO FECHAR */}
        <button onClick={onClose} className="absolute top-6 right-6 z-50 h-10 w-10 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg border border-white/10">
          <i className="fas fa-times"></i>
        </button>

        {/* --- LADO ESQUERDO: CAMPO DE FUTEBOL --- */}
        <div className="flex-1 relative bg-[#1a2e22] overflow-hidden flex items-center justify-center p-4">
          {/* Gramado CSS */}
          <div className="absolute inset-0 opacity-30" 
               style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #000 50px)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

          {/* O Campo (Container Relativo) */}
          <div className="relative w-full max-w-[600px] aspect-[2/3] border-2 border-white/20 rounded-xl shadow-2xl bg-[#006837]/20 backdrop-blur-sm">
            
            {/* Linhas do Campo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[15%] border-b-2 border-x-2 border-white/20 rounded-b-xl"></div> {/* Área ATA */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[15%] border-t-2 border-x-2 border-white/20 rounded-t-xl"></div> {/* Área GOL */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20"></div> {/* Meio Campo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full"></div> {/* Círculo Central */}

            {/* SLOTS DOS JOGADORES */}
            {FORMATION_SLOTS.map((slot) => {
              const player = getPlayerInSlot(slot.id);
              
              return (
                <div 
                  key={slot.id}
                  onClick={() => setSelectingSlot(slot.id)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110"
                  style={{ top: slot.top, left: slot.left }}
                >
                  {player ? (
                    <div className="flex flex-col items-center group relative">
                      <div className="h-14 w-14 rounded-full border-2 border-[#f1c40f] overflow-hidden bg-black shadow-[0_0_15px_rgba(241,196,15,0.4)]">
                        <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="mt-1 bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase border border-white/10 whitespace-nowrap">
                        {player.name.split(' ')[0]}
                      </div>
                      <div className="mt-0.5 text-[7px] font-bold text-[#f1c40f] bg-black/50 px-1 rounded">{player.recommendation}</div>
                      
                      {/* Botão Remover */}
                      <button 
                        onClick={(e) => handleRemovePlayer(e, slot.id)}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center opacity-60 hover:opacity-100 ${selectingSlot === slot.id ? 'animate-pulse opacity-100 scale-110' : ''}`}>
                      <div className="h-10 w-10 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-black/20">
                        <i className="fas fa-plus text-white/50 text-xs"></i>
                      </div>
                      <span className="mt-1 text-[8px] font-black text-white/50 uppercase tracking-widest">{slot.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- LADO DIREITO: SELETOR DE JOGADORES (Só aparece ao clicar num slot) --- */}
        {selectingSlot && (
          <div className="w-full md:w-96 bg-[#0f1a16] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 z-20 absolute right-0 top-0 bottom-0 md:relative shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-[#f1c40f] font-oswald text-lg font-bold uppercase">Selecionar Atleta</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                  Posição Alvo: <span className="text-white">{FORMATION_SLOTS.find(s => s.id === selectingSlot)?.label}</span>
                </p>
              </div>
              <button onClick={() => setSelectingSlot(null)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Buscar nome ou posição..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#006837]"
                />
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {availablePlayers.length > 0 ? (
                availablePlayers.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelectPlayer(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-transparent hover:border-[#f1c40f]/50 hover:bg-[#f1c40f]/10 transition-all group text-left"
                  >
                    <img src={p.photoUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-black" />
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-[#f1c40f] uppercase">{p.name}</h4>
                      <div className="flex gap-2 text-[8px] font-black uppercase text-slate-500">
                        <span>{p.position1}</span>
                        <span className="text-[#006837]">{p.recommendation}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 opacity-50">
                  <p className="text-[9px] font-black text-slate-500 uppercase">Nenhum jogador encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShadowTeamModal;