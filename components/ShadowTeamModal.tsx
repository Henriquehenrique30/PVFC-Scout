
import React, { useState, useEffect, useRef } from 'react';
import { Player, User, Position } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ShadowTeamModalProps {
  players: Player[];
  currentUser: User;
  onClose: () => void;
}

// --- CONFIGURAÇÃO DE POSIÇÕES EXPANDIDA HORIZONTALMENTE ---
const FORMATION_SLOTS = [
  { id: 'ata', label: 'ATA', top: '15%', left: '50%' }, 
  { id: 'ext_esq', label: 'EXT', top: '25%', left: '12%' }, 
  { id: 'ext_dir', label: 'EXT', top: '25%', left: '88%' }, 
  { id: 'mei', label: 'MEI', top: '38%', left: '50%' }, 
  { id: 'vol1', label: 'VOL', top: '55%', left: '30%' }, 
  { id: 'vol2', label: 'VOL', top: '55%', left: '70%' }, 
  { id: 'lte', label: 'LTE', top: '70%', left: '8%' },  
  { id: 'ltd', label: 'LTD', top: '70%', left: '92%' }, 
  { id: 'zag1', label: 'ZAG', top: '80%', left: '32%' }, 
  { id: 'zag2', label: 'ZAG', top: '80%', left: '68%' }, 
  { id: 'gol', label: 'GOL', top: '90%', left: '50%' }, 
];

const ShadowTeamModal: React.FC<ShadowTeamModalProps> = ({ players, currentUser, onClose }) => {
  const STORAGE_KEY = `pvfc_shadow_team_${currentUser.id}`;
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [squad, setSquad] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'all'>('all');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(squad));
  }, [squad, STORAGE_KEY]);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const wasSelecting = selectingSlot;
      setSelectingSlot(null); 
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1a2e22',
        logging: false,
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight
      });

      if (wasSelecting) setSelectingSlot(wasSelecting);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ShadowTeam_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

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
    (posFilter === 'all' || p.position1 === posFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.position1.toLowerCase().includes(search.toLowerCase()) ||
     p.club.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0f0d] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
      
      {/* BOTÕES PRINCIPAIS */}
      <div className="absolute top-6 right-6 z-[70] flex gap-3">
        <button 
          onClick={handleExportPDF}
          disabled={isExporting || selectingSlot !== null}
          className="h-12 px-6 bg-[#f1c40f] text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-white transition-colors flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title={selectingSlot ? "Feche a barra lateral para gerar o PDF" : "Gerar PDF"}
        >
          {isExporting ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-file-pdf text-lg"></i>}
          {isExporting ? 'Gerando...' : 'Salvar PDF'}
        </button>

        <button onClick={onClose} className="h-12 w-12 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg border border-white/10">
          <i className="fas fa-times text-lg"></i>
        </button>
      </div>

      {/* ÁREA DE IMPRESSÃO */}
      <div ref={printRef} className="flex-1 relative bg-[#1a2e22] overflow-hidden flex items-center justify-center">
        
        <div className="absolute top-6 left-8 z-10 pointer-events-none">
           <h2 className="font-oswald text-4xl text-white uppercase font-bold tracking-wider drop-shadow-lg">Shadow Team</h2>
           <p className="text-xs font-bold text-[#f1c40f] uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
             <i className="fas fa-user-tie"></i>
             Analista: {currentUser.name}
           </p>
        </div>

        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #000 50px)' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>

        <div className="relative w-full h-full bg-[#006837]/10 backdrop-blur-sm">
          {/* Linhas de Campo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-b-2 border-x-2 border-white/20"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-t-2 border-x-2 border-white/20"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-white/10 rounded-full"></div>

          {FORMATION_SLOTS.map((slot) => {
            const playersInSlot = getPlayersInSlot(slot.id);
            const isSelected = selectingSlot === slot.id;
            
            return (
              <div 
                key={slot.id}
                onClick={() => setSelectingSlot(slot.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer flex flex-col items-center group ${isSelected ? 'z-50 scale-110' : 'z-10 hover:scale-105'}`}
                style={{ top: slot.top, left: slot.left }}
              >
                <div className={`mb-1 px-3 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-lg backdrop-blur-md ${
                  isSelected ? 'bg-[#f1c40f] text-black border-[#f1c40f]' : 'bg-black/70 text-white/70 border-white/10'
                }`}>
                  {slot.label} <span className="text-[8px] opacity-70">({playersInSlot.length})</span>
                </div>

                <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl transition-all ${
                  playersInSlot.length > 0 ? 'bg-black/20 border border-white/5 backdrop-blur-sm' : ''
                }`}>
                  {playersInSlot.length > 0 ? (
                    playersInSlot.map((player, idx) => (
                      <div key={player.id} className="relative flex flex-col items-center justify-center">
                         <div className={`relative h-20 w-20 rounded-lg overflow-hidden border transition-all ${
                            idx === 0 
                              ? 'border-[#f1c40f] shadow-[0_0_20px_rgba(241,196,15,0.5)] z-20 scale-105' 
                              : 'border-white/10 opacity-90'
                         }`}>
                           <img 
                              src={player.photoUrl} 
                              crossOrigin="anonymous"
                              className="h-full w-full object-cover" 
                           />
                           <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] font-bold text-white text-center py-0.5 uppercase truncate px-0.5">
                             {player.name.split(' ')[0]}
                           </div>
                           {idx === 0 && (
                             <div className="absolute top-0 left-0 bg-black/80 p-0.5 rounded-br-lg border-b border-r border-[#f1c40f]">
                               <i className="fas fa-crown text-[9px] text-[#f1c40f]"></i>
                             </div>
                           )}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 flex items-center justify-center p-2">
                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center text-white/20 group-hover:text-[#f1c40f] group-hover:border-[#f1c40f] transition-all">
                          <i className="fas fa-plus text-base"></i>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR DE SELEÇÃO */}
      {selectingSlot && (
        <div data-html2canvas-ignore className="w-full md:w-[450px] bg-[#050807] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 z-20 absolute right-0 top-0 bottom-0 md:relative shadow-2xl">
          
          <div className="p-6 pt-8 border-b border-white/5 flex items-center gap-4 bg-[#0a0f0d]">
            <button onClick={() => setSelectingSlot(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all shrink-0">
              <i className="fas fa-chevron-right"></i>
            </button>
            
            <div className="flex-1">
              <h3 className="text-[#f1c40f] font-oswald text-2xl font-bold uppercase leading-none">Shadow List</h3>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">
                Posição: <span className="text-white bg-[#006837] px-2 py-0.5 rounded ml-1 text-[10px]">{FORMATION_SLOTS.find(s => s.id === selectingSlot)?.label}</span>
              </p>
            </div>
            <div className="w-16"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Ordem de Preferência */}
            <div className="p-6 border-b border-white/5 bg-[#0a0f0d]/50">
              <h4 className="text-[9px] font-black text-[#006837] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i className="fas fa-list-ol"></i> Ordem de Preferência
              </h4>
              
              <div className="space-y-2.5">
                {getPlayersInSlot(selectingSlot).map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a2e22]/40 border border-[#006837]/30 group transition-all hover:bg-[#1a2e22]/60 hover:shadow-lg">
                    <div className="flex flex-col items-center justify-center w-6 text-xs font-black text-[#f1c40f]">
                      {idx + 1}º
                    </div>
                    <img src={p.photoUrl} className="h-10 w-10 rounded-lg object-cover bg-black" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-bold text-white uppercase truncate">{p.name}</h4>
                      <span className="text-[8px] text-slate-500 uppercase">{p.club}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                         <>
                          <button onClick={() => promoteToStarter(selectingSlot, idx)} className="h-7 w-7 rounded-lg bg-[#f1c40f] text-black text-[10px] flex items-center justify-center hover:scale-110 transition-transform"><i className="fas fa-crown"></i></button>
                          <button onClick={() => movePlayer(selectingSlot, idx, idx - 1)} className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center hover:bg-white hover:text-black"><i className="fas fa-arrow-up"></i></button>
                         </>
                      )}
                      {idx < getPlayersInSlot(selectingSlot).length - 1 && (
                        <button onClick={() => movePlayer(selectingSlot, idx, idx + 1)} className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center hover:bg-white hover:text-black"><i className="fas fa-arrow-down"></i></button>
                      )}
                      <button onClick={() => removePlayer(selectingSlot, p.id)} className="h-7 w-7 rounded-lg bg-red-600/20 text-red-500 text-[10px] flex items-center justify-center hover:bg-red-600 hover:text-white ml-1"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banco de Atletas com Filtros */}
            <div className="p-6 flex-1">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i className="fas fa-search"></i> Banco de Atletas
              </h4>
              
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar nome, clube ou posição..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-xs text-white outline-none focus:border-[#f1c40f] transition-all" 
                  />
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                </div>

                {/* FILTRO DE POSIÇÕES */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setPosFilter('all')}
                    className={`flex-1 min-w-[50px] px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                      posFilter === 'all' 
                      ? 'bg-[#f1c40f] text-black shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    TODOS
                  </button>
                  {Object.values(Position).map(p => (
                    <button 
                      key={p}
                      onClick={() => setPosFilter(p)}
                      className={`flex-1 min-w-[40px] px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                        posFilter === p 
                        ? 'bg-[#006837] text-white shadow-lg' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map(p => (
                    <button key={p.id} onClick={() => addPlayer(selectingSlot, p.id)} className="w-full flex items-center gap-4 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/5 transition-all group text-left">
                      <img src={p.photoUrl} alt={p.name} className="h-9 w-9 rounded-lg object-cover bg-black grayscale group-hover:grayscale-0 transition-all" />
                      <div className="flex-1">
                        <h4 className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase truncate">{p.name}</h4>
                        <div className="flex gap-2">
                          <span className="text-[8px] font-black text-slate-600 uppercase">{p.position1}</span>
                          <span className="text-[8px] font-black text-[#006837] uppercase">{p.recommendation}</span>
                        </div>
                      </div>
                      <i className="fas fa-plus text-[#f1c40f] opacity-0 group-hover:opacity-100 transition-opacity mr-2"></i>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl opacity-40">
                    <p className="text-[9px] font-black text-slate-600 uppercase">Nenhum atleta encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShadowTeamModal;