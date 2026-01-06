import React, { useState, useEffect } from 'react';
import { Player } from '../types';

interface ShadowTeamModalProps {
  players: Player[];
  onClose: () => void;
}

// AJUSTE DE POSIÇÕES: ATA subiu para 6%, EXT subiu para 20%
const FORMATION_SLOTS = [
  { id: 'gol', label: 'GOL', top: '88%', left: '50%' },
  { id: 'zag1', label: 'ZAG', top: '72%', left: '35%' },
  { id: 'zag2', label: 'ZAG', top: '72%', left: '65%' },
  { id: 'lte', label: 'LTE', top: '65%', left: '10%' },
  { id: 'ltd', label: 'LTD', top: '65%', left: '90%' },
  { id: 'vol1', label: 'VOL', top: '50%', left: '35%' },
  { id: 'vol2', label: 'VOL', top: '50%', left: '65%' },
  { id: 'mei', label: 'MEI', top: '36%', left: '50%' },
  { id: 'ext_esq', label: 'EXT', top: '20%', left: '15%' },
  { id: 'ext_dir', label: 'EXT', top: '20%', left: '85%' },
  { id: 'ata', label: 'ATA', top: '6%', left: '50%' }, // <--- Mudança Principal (estava 15%)
];

const ShadowTeamModal: React.FC<ShadowTeamModalProps> = ({ players, onClose }) => {
  const [squad, setSquad] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('pvfc_shadow_team_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('pvfc_shadow_team_v2', JSON.stringify(squad));
  }, [squad]);

  const movePlayer = (slotId: string, fromIndex: number, toIndex: number) => {
    setSquad(prev => {
      const list = [...(prev[slotId] || [])];
      if (toIndex < 0 || toIndex >= list.length) return prev;
      
      const item = list[fromIndex];
      list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      return { ...prev, [slotId]: list };
    });
  };

  const promoteToStarter = (slotId: string, index: number) => {
    movePlayer(slotId, index, 0);
  };

  const addPlayer = (slotId: string, playerId: string) => {
    setSquad(prev => {
      const currentList = prev[slotId] || [];
      if (currentList.includes(playerId)) return prev;
      if (currentList.length >= 4) {
        alert("Máximo de 4 opções por posição.");
        return prev;
      }
      return { ...prev, [slotId]: [...currentList, playerId] };
    });
  };

  const removePlayer = (slotId: string, playerId: string) => {
    setSquad(prev => ({
      ...prev,
      [slotId]: (prev[slotId] || []).filter(id => id !== playerId)
    }));
  };

  const getPlayersInSlot = (slotId: string) => {
    const ids = squad[slotId] || [];
    return ids.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  };

  const selectedPlayerIds = selectingSlot ? (squad[selectingSlot] || []) : [];
  
  const searchResults = players.filter(p => 
    !selectedPlayerIds.includes(p.id) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.position1.toLowerCase().includes(search.toLowerCase()) ||
     p.club.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/98 backdrop-blur-xl p-4 overflow-hidden">
      <div className="relative w-[95vw] h-[92vh] bg-[#0a0f0d] border border-[#006837]/30 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 h-12 w-12 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg border border-white/10">
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="flex-1 relative bg-[#1a2e22] overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #000 50px)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

          <div className="relative w-full h-full max-w-[1200px] border-2 border-white/10 rounded-xl shadow-2xl bg-[#006837]/10 backdrop-blur-sm mx-auto my-2">
            
            {/* Desenho do Campo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[12%] border-b-2 border-x-2 border-white/20 rounded-b-xl"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[12%] border-t-2 border-x-2 border-white/20 rounded-t-xl"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/10 rounded-full"></div>

            {FORMATION_SLOTS.map((slot) => {
              const playersInSlot = getPlayersInSlot(slot.id);
              const isSelected = selectingSlot === slot.id;
              
              return (
                <div 
                  key={slot.id}
                  onClick={() => setSelectingSlot(slot.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer z-10 flex flex-col items-center ${isSelected ? 'z-50 scale-105' : 'hover:scale-105'}`}
                  style={{ top: slot.top, left: slot.left }}
                >
                  <div className={`mb-1.5 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                    isSelected ? 'bg-[#f1c40f] text-black border-[#f1c40f]' : 'bg-black/60 text-white/50 border-white/10'
                  }`}>
                    {slot.label} <span className="text-[9px] opacity-70">({playersInSlot.length})</span>
                  </div>

                  <div className="flex flex-col gap-1.5 items-center min-w-[120px]">
                    {playersInSlot.length > 0 ? (
                      playersInSlot.map((player, idx) => (
                        <div key={player.id} className="relative group w-full flex justify-center">
                          <div className={`flex items-center gap-3 p-1.5 rounded-xl border shadow-xl backdrop-blur-md transition-all w-fit ${
                            idx === 0 
                              ? 'bg-[#006837]/90 border-[#006837] scale-110 z-20 shadow-[0_0_20px_rgba(0,104,55,0.5)]' 
                              : 'bg-slate-900/80 border-slate-700 scale-95 opacity-90'
                          }`}>
                             {idx === 0 && <i className="fas fa-crown text-[10px] text-[#f1c40f] absolute -left-2 -top-2 bg-black rounded-full p-1.5 shadow-md z-30 border border-[#f1c40f]/30"></i>}
                             
                             <img src={player.photoUrl} className={`${idx === 0 ? 'h-12 w-12' : 'h-8 w-8'} rounded-lg bg-black object-cover border border-white/10`} />
                             
                             <div className="flex flex-col leading-none pr-2">
                                <span className={`${idx === 0 ? 'text-[11px]' : 'text-[9px]'} font-bold text-white uppercase truncate max-w-[100px]`}>{player.name.split(' ')[0]}</span>
                                <span className="text-[8px] font-bold text-[#f1c40f] uppercase">{player.club}</span>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-12 w-12 rounded-full border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center text-white/20 hover:text-[#f1c40f] hover:border-[#f1c40f] transition-all">
                        <i className="fas fa-plus text-xs"></i>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectingSlot && (
          <div className="w-full md:w-[450px] bg-[#050807] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 z-20 absolute right-0 top-0 bottom-0 md:relative shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a0f0d]">
              <div>
                <h3 className="text-[#f1c40f] font-oswald text-2xl font-bold uppercase">Shadow List</h3>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                  Posição: <span className="text-white bg-[#006837] px-2 py-0.5 rounded ml-1 text-[11px]">{FORMATION_SLOTS.find(s => s.id === selectingSlot)?.label}</span>
                </p>
              </div>
              <button onClick={() => setSelectingSlot(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-6 border-b border-white/5 bg-[#0a0f0d]/50">
                <h4 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-list-ol"></i> Ordem de Preferência
                </h4>
                
                <div className="space-y-3">
                  {getPlayersInSlot(selectingSlot).map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl bg-[#1a2e22]/40 border border-[#006837]/30 group transition-all hover:bg-[#1a2e22]/60 hover:shadow-lg">
                      <div className="flex flex-col items-center justify-center w-6 text-sm font-black text-[#f1c40f]">
                        {idx + 1}º
                      </div>
                      <img src={p.photoUrl} className="h-10 w-10 rounded-xl object-cover bg-black" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-bold text-white uppercase truncate">{p.name}</h4>
                        <span className="text-[9px] text-slate-500 uppercase">{p.club}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <>
                            <button onClick={() => promoteToStarter(selectingSlot, idx)} title="Tornar Titular" className="h-7 w-7 rounded-lg bg-[#f1c40f] text-black text-[10px] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                              <i className="fas fa-crown"></i>
                            </button>
                            <button onClick={() => movePlayer(selectingSlot, idx, idx - 1)} className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center hover:bg-white hover:text-black">
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          </>
                        )}
                        {idx < getPlayersInSlot(selectingSlot).length - 1 && (
                          <button onClick={() => movePlayer(selectingSlot, idx, idx + 1)} className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center hover:bg-white hover:text-black">
                            <i className="fas fa-arrow-down"></i>
                          </button>
                        )}
                        <button onClick={() => removePlayer(selectingSlot, p.id)} className="h-7 w-7 rounded-lg bg-red-600/20 text-red-500 text-[10px] flex items-center justify-center hover:bg-red-600 hover:text-white ml-1">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {getPlayersInSlot(selectingSlot).length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-600 uppercase">Nenhum atleta selecionado</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fas fa-search"></i> Banco de Atletas
                </h4>
                
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Buscar atleta..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm text-white outline-none focus:border-[#f1c40f] transition-all"
                  />
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm"></i>
                </div>

                <div className="space-y-2">
                  {searchResults.length > 0 ? (
                    searchResults.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => addPlayer(selectingSlot, p.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:bg-white/5 hover:border-white/5 transition-all group text-left"
                      >
                        <img src={p.photoUrl} alt={p.name} className="h-10 w-10 rounded-xl object-cover bg-black grayscale group-hover:grayscale-0 transition-all" />
                        <div className="flex-1">
                          <h4 className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase">{p.name}</h4>
                          <div className="flex gap-2">
                            <span className="text-[9px] font-black text-slate-600 uppercase">{p.position1}</span>
                            <span className="text-[9px] font-black text-[#006837] uppercase">{p.recommendation}</span>
                          </div>
                        </div>
                        <i className="fas fa-plus text-[#f1c40f] text-lg opacity-0 group-hover:opacity-100 transition-opacity mr-2"></i>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-40">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Nenhum resultado encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShadowTeamModal;