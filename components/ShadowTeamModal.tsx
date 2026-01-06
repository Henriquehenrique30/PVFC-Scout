import React, { useState, useEffect } from 'react';
import { Player } from '../types';

interface ShadowTeamModalProps {
  players: Player[];
  onClose: () => void;
}

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
  const [squad, setSquad] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('pvfc_shadow_team_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('pvfc_shadow_team_v2', JSON.stringify(squad));
  }, [squad]);

  // --- FUNÇÕES DE ORDENAÇÃO ---
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
  // ---------------------------

  const getPlayersInSlot = (slotId: string) => {
    const ids = squad[slotId] || [];
    return ids.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  };

  const selectedPlayerIds = selectingSlot ? (squad[selectingSlot] || []) : [];
  
  // Lista de pesquisa (exclui os que já estão selecionados na posição atual)
  const searchResults = players.filter(p => 
    !selectedPlayerIds.includes(p.id) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.position1.toLowerCase().includes(search.toLowerCase()) ||
     p.club.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden">
      <div className="relative w-full max-w-[1400px] h-[90vh] bg-[#0a0f0d] border border-[#006837]/30 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 h-10 w-10 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg border border-white/10">
          <i className="fas fa-times"></i>
        </button>

        {/* --- CAMPO (VISUALIZADOR) --- */}
        <div className="flex-1 relative bg-[#1a2e22] overflow-hidden flex items-center justify-center p-2">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #000 50px)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

          <div className="relative w-full h-full max-w-[900px] border-2 border-white/10 rounded-xl shadow-2xl bg-[#006837]/10 backdrop-blur-sm mx-auto my-4">
            {/* Linhas do Campo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[12%] border-b-2 border-x-2 border-white/20 rounded-b-xl"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[12%] border-t-2 border-x-2 border-white/20 rounded-t-xl"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/10 rounded-full"></div>

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
                  <div className={`mb-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shadow-lg ${
                    isSelected ? 'bg-[#f1c40f] text-black border-[#f1c40f]' : 'bg-black/60 text-white/50 border-white/10'
                  }`}>
                    {slot.label} <span className="text-[7px] opacity-70">({playersInSlot.length})</span>
                  </div>

                  <div className="flex flex-col gap-1 items-center min-w-[100px]">
                    {playersInSlot.length > 0 ? (
                      playersInSlot.map((player, idx) => (
                        <div key={player.id} className="relative group w-full">
                          <div className={`flex items-center gap-2 p-1 rounded-lg border shadow-xl backdrop-blur-md transition-all ${
                            idx === 0 
                              ? 'bg-[#006837]/90 border-[#006837] scale-100 z-10' // Titular
                              : 'bg-slate-900/80 border-slate-700 scale-95 opacity-90' // Reserva
                          }`}>
                             {idx === 0 && <i className="fas fa-crown text-[8px] text-[#f1c40f] absolute -left-1 -top-1 bg-black rounded-full p-1 shadow-sm z-20"></i>}
                             <img src={player.photoUrl} className="h-6 w-6 rounded-full bg-black object-cover border border-white/10" />
                             <div className="flex flex-col leading-none">
                                <span className="text-[8px] font-bold text-white uppercase truncate max-w-[70px]">{player.name.split(' ')[0]}</span>
                                <span className="text-[6px] font-bold text-[#f1c40f] uppercase">{player.club}</span>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-dashed border-white/20 bg-black/20 flex items-center justify-center text-white/20">
                        <i className="fas fa-plus text-[8px]"></i>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SIDEBAR DE GERENCIAMENTO (LADO DIREITO) --- */}
        {selectingSlot && (
          <div className="w-full md:w-[420px] bg-[#050807] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 z-20 absolute right-0 top-0 bottom-0 md:relative shadow-2xl">
            
            {/* Header da Sidebar */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0f0d]">
              <div>
                <h3 className="text-[#f1c40f] font-oswald text-lg font-bold uppercase">Shadow List</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                  Posição: <span className="text-white bg-[#006837] px-1.5 py-0.5 rounded ml-1">{FORMATION_SLOTS.find(s => s.id === selectingSlot)?.label}</span>
                </p>
              </div>
              <button onClick={() => setSelectingSlot(null)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              
              {/* SEÇÃO 1: JOGADORES SELECIONADOS (PRIORIDADE) */}
              <div className="p-4 border-b border-white/5 bg-[#0a0f0d]/50">
                <h4 className="text-[9px] font-black text-[#006837] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <i className="fas fa-list-ol"></i> Ordem de Preferência
                </h4>
                
                <div className="space-y-2">
                  {getPlayersInSlot(selectingSlot).map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-[#1a2e22]/40 border border-[#006837]/30 group transition-all hover:bg-[#1a2e22]/60">
                      <div className="flex flex-col items-center justify-center w-5 text-[10px] font-black text-[#f1c40f]">
                        {idx + 1}º
                      </div>
                      <img src={p.photoUrl} className="h-8 w-8 rounded-lg object-cover bg-black" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold text-white uppercase truncate">{p.name}</h4>
                        <span className="text-[8px] text-slate-500 uppercase">{p.club}</span>
                      </div>
                      
                      {/* Controles de Ordem */}
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <>
                            <button onClick={() => promoteToStarter(selectingSlot, idx)} title="Tornar 1ª Opção" className="h-6 w-6 rounded bg-[#f1c40f] text-black text-[9px] flex items-center justify-center hover:scale-110 transition-transform">
                              <i className="fas fa-crown"></i>
                            </button>
                            <button onClick={() => movePlayer(selectingSlot, idx, idx - 1)} title="Subir" className="h-6 w-6 rounded bg-slate-800 text-slate-300 text-[9px] flex items-center justify-center hover:bg-white hover:text-black">
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          </>
                        )}
                        
                        {idx < getPlayersInSlot(selectingSlot).length - 1 && (
                          <button onClick={() => movePlayer(selectingSlot, idx, idx + 1)} title="Descer" className="h-6 w-6 rounded bg-slate-800 text-slate-300 text-[9px] flex items-center justify-center hover:bg-white hover:text-black">
                            <i className="fas fa-arrow-down"></i>
                          </button>
                        )}

                        <button onClick={() => removePlayer(selectingSlot, p.id)} title="Remover da Lista" className="h-6 w-6 rounded bg-red-600/20 text-red-500 text-[9px] flex items-center justify-center hover:bg-red-600 hover:text-white ml-1">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {getPlayersInSlot(selectingSlot).length === 0 && (
                    <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Lista vazia. Adicione abaixo.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 2: BANCO DE DADOS (PESQUISA) */}
              <div className="p-4 flex-1">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <i className="fas fa-search"></i> Banco de Atletas
                </h4>
                
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Buscar para adicionar..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-xs text-white outline-none focus:border-[#f1c40f] transition-all"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                </div>

                <div className="space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => addPlayer(selectingSlot, p.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/5 transition-all group text-left"
                      >
                        <img src={p.photoUrl} alt={p.name} className="h-8 w-8 rounded-lg object-cover bg-black grayscale group-hover:grayscale-0 transition-all" />
                        <div className="flex-1">
                          <h4 className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase">{p.name}</h4>
                          <div className="flex gap-2">
                            <span className="text-[8px] font-black text-slate-600 uppercase">{p.position1}</span>
                            <span className="text-[8px] font-black text-[#006837] uppercase">{p.recommendation}</span>
                          </div>
                        </div>
                        <i className="fas fa-plus text-[#f1c40f] opacity-0 group-hover:opacity-100 transition-opacity mr-2"></i>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 opacity-40">
                      <p className="text-[9px] font-black text-slate-500 uppercase">Nenhum resultado disponível</p>
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