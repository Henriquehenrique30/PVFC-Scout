import React, { useState, useEffect } from 'react';
import { Player, Position } from '../types';

interface ShadowTeamModalProps {
  players: Player[];
  onClose: () => void;
}

// Mapeamento das posições no campo (Ajustei um pouco para caber as listas)
const FORMATION_SLOTS = [
  { id: 'gol', label: 'GOL', top: '85%', left: '50%' },
  { id: 'zag1', label: 'ZAG', top: '70%', left: '35%' },
  { id: 'zag2', label: 'ZAG', top: '70%', left: '65%' },
  { id: 'lte', label: 'LTE', top: '60%', left: '10%' },
  { id: 'ltd', label: 'LTD', top: '60%', left: '90%' },
  { id: 'vol1', label: 'VOL', top: '48%', left: '35%' },
  { id: 'vol2', label: 'VOL', top: '48%', left: '65%' },
  { id: 'mei', label: 'MEI', top: '32%', left: '50%' },
  { id: 'ext_esq', label: 'EXT', top: '20%', left: '15%' },
  { id: 'ext_dir', label: 'EXT', top: '20%', left: '85%' },
  { id: 'ata', label: 'ATA', top: '12%', left: '50%' },
];

const ShadowTeamModal: React.FC<ShadowTeamModalProps> = ({ players, onClose }) => {
  // Agora o estado guarda uma LISTA de IDs por posição: { 'gol': ['id1', 'id2'], ... }
  const [squad, setSquad] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('pvfc_shadow_team_v2'); // Mudei a chave para não conflitar com a versão anterior
    return saved ? JSON.parse(saved) : {};
  });

  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('pvfc_shadow_team_v2', JSON.stringify(squad));
  }, [squad]);

  const handleTogglePlayer = (playerId: string) => {
    if (!selectingSlot) return;

    setSquad(prev => {
      const currentList = prev[selectingSlot] || [];
      const isSelected = currentList.includes(playerId);
      
      let newList;
      if (isSelected) {
        newList = currentList.filter(id => id !== playerId);
      } else {
        // Limita a 4 jogadores por posição para não quebrar o layout visualmente
        if (currentList.length >= 4) {
          alert("Máximo de 4 jogadores por posição no visualizador.");
          return prev;
        }
        newList = [...currentList, playerId];
      }
      
      return { ...prev, [selectingSlot]: newList };
    });
  };

  const handleRemovePlayer = (e: React.MouseEvent, slotId: string, playerId: string) => {
    e.stopPropagation();
    setSquad(prev => ({
      ...prev,
      [slotId]: prev[slotId].filter(id => id !== playerId)
    }));
  };

  // Pega os objetos Player completos para uma posição
  const getPlayersInSlot = (slotId: string) => {
    const ids = squad[slotId] || [];
    return ids.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  };

  // Filtra jogadores para seleção (busca global)
  const availablePlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.position1.toLowerCase().includes(search.toLowerCase()) ||
    p.club.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden">
      <div className="relative w-full max-w-[1400px] h-[90vh] bg-[#0a0f0d] border border-[#006837]/30 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 h-10 w-10 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg border border-white/10">
          <i className="fas fa-times"></i>
        </button>

        {/* --- CAMPO (AREA PRINCIPAL) --- */}
        <div className="flex-1 relative bg-[#1a2e22] overflow-hidden flex items-center justify-center p-2">
          {/* Gramado CSS */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #000 50px)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

          {/* Container do Campo */}
          <div className="relative w-full h-full max-w-[900px] border-2 border-white/10 rounded-xl shadow-2xl bg-[#006837]/10 backdrop-blur-sm mx-auto my-4">
            
            {/* Linhas do Campo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[12%] border-b-2 border-x-2 border-white/20 rounded-b-xl"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[12%] border-t-2 border-x-2 border-white/20 rounded-t-xl"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/10 rounded-full"></div>

            {/* SLOTS (POSIÇÕES) */}
            {FORMATION_SLOTS.map((slot) => {
              const selectedPlayers = getPlayersInSlot(slot.id);
              const isSelected = selectingSlot === slot.id;
              
              return (
                <div 
                  key={slot.id}
                  onClick={() => setSelectingSlot(slot.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer z-10 flex flex-col items-center ${isSelected ? 'z-50 scale-105' : 'hover:scale-105'}`}
                  style={{ top: slot.top, left: slot.left }}
                >
                  {/* LABEL DA POSIÇÃO */}
                  <div className={`mb-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shadow-lg ${
                    isSelected ? 'bg-[#f1c40f] text-black border-[#f1c40f]' : 'bg-black/60 text-white/50 border-white/10'
                  }`}>
                    {slot.label} <span className="text-[7px] opacity-70">({selectedPlayers.length})</span>
                  </div>

                  {/* LISTA DE JOGADORES (STACK VERTICAL) */}
                  <div className="flex flex-col gap-1 items-center min-w-[100px]">
                    {selectedPlayers.length > 0 ? (
                      selectedPlayers.map((player, idx) => (
                        <div key={player.id} className="relative group w-full">
                          <div className={`flex items-center gap-2 p-1 rounded-lg border shadow-xl backdrop-blur-md transition-all ${
                            idx === 0 
                              ? 'bg-[#006837]/90 border-[#006837] scale-100 z-10' // Titular/Principal destaque
                              : 'bg-slate-900/80 border-slate-700 scale-95 opacity-90' // Reservas um pouco menores
                          }`}>
                             <img src={player.photoUrl} className="h-6 w-6 rounded-full bg-black object-cover border border-white/10" />
                             <div className="flex flex-col leading-none">
                                <span className="text-[8px] font-bold text-white uppercase truncate max-w-[70px]">{player.name.split(' ')[0]}</span>
                                <span className="text-[6px] font-bold text-[#f1c40f] uppercase">{player.club}</span>
                             </div>
                             
                             {/* Botão Remover (X) no hover */}
                             <button 
                                onClick={(e) => handleRemovePlayer(e, slot.id, player.id)}
                                className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full text-white text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // SLOT VAZIO
                      <div className="h-8 w-8 rounded-full border border-dashed border-white/20 bg-black/20 flex items-center justify-center text-white/20 hover:text-[#f1c40f] hover:border-[#f1c40f] transition-all">
                        <i className="fas fa-plus text-[8px]"></i>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SIDEBAR DE SELEÇÃO (LADO DIREITO) --- */}
        {selectingSlot && (
          <div className="w-full md:w-[400px] bg-[#0f1a16] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 z-20 absolute right-0 top-0 bottom-0 md:relative shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#050807]">
              <div>
                <h3 className="text-[#f1c40f] font-oswald text-lg font-bold uppercase">Shadow List</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                  Posição: <span className="text-white bg-[#006837] px-1 rounded">{FORMATION_SLOTS.find(s => s.id === selectingSlot)?.label}</span>
                </p>
              </div>
              <button onClick={() => setSelectingSlot(null)} className="text-slate-500 hover:text-white"><i className="fas fa-chevron-right"></i></button>
            </div>
            
            <div className="p-4 border-b border-white/5 bg-[#0a0f0d]">
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Pesquisar atleta..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#f1c40f] transition-all"
                />
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-4 py-2">Clique para Adicionar/Remover</p>
              {availablePlayers.length > 0 ? (
                availablePlayers.map(p => {
                  const isSelected = (squad[selectingSlot!] || []).includes(p.id);
                  return (
                    <button 
                      key={p.id}
                      onClick={() => handleTogglePlayer(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${
                        isSelected 
                          ? 'bg-[#006837]/20 border-[#006837] shadow-[inset_0_0_10px_rgba(0,104,55,0.2)]' 
                          : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="relative">
                        <img src={p.photoUrl} alt={p.name} className={`h-10 w-10 rounded-lg object-cover bg-black ${isSelected ? 'grayscale-0' : 'grayscale-[50%]'}`} />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#f1c40f] rounded-full flex items-center justify-center text-black text-[8px] font-bold shadow-md">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-xs font-bold uppercase ${isSelected ? 'text-[#f1c40f]' : 'text-slate-300'}`}>{p.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase">{p.position1}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            p.recommendation.includes('Elite') ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {p.recommendation}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
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