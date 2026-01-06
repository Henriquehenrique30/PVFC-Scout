import React, { useState, useEffect, useRef } from 'react';
import { Player, User } from '../types'; // Importe User aqui
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ShadowTeamModalProps {
  players: Player[];
  currentUser: User; // Recebe o usuário para salvar na chave correta
  onClose: () => void;
}

// --- CONFIGURAÇÃO DE POSIÇÕES ---
const FORMATION_SLOTS = [
  { id: 'ata', label: 'ATA', top: '5%', left: '50%' }, 
  { id: 'ext_esq', label: 'EXT', top: '18%', left: '8%' }, 
  { id: 'ext_dir', label: 'EXT', top: '18%', left: '92%' }, 
  { id: 'mei', label: 'MEI', top: '28%', left: '50%' }, 
  { id: 'vol1', label: 'VOL', top: '50%', left: '32%' }, 
  { id: 'vol2', label: 'VOL', top: '50%', left: '68%' }, 
  { id: 'lte', label: 'LTE', top: '65%', left: '5%' }, 
  { id: 'ltd', label: 'LTD', top: '65%', left: '95%' }, 
  { id: 'zag1', label: 'ZAG', top: '75%', left: '35%' }, 
  { id: 'zag2', label: 'ZAG', top: '75%', left: '65%' }, 
  { id: 'gol', label: 'GOL', top: '92%', left: '50%' }, 
];

const ShadowTeamModal: React.FC<ShadowTeamModalProps> = ({ players, currentUser, onClose }) => {
  // CHAVE ÚNICA POR USUÁRIO: Evita perder dados ou misturar times
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

  // Salva automaticamente sempre que o time muda
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(squad));
  }, [squad, STORAGE_KEY]);

  // --- FUNÇÃO DE EXPORTAR PDF ---
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      // Pequeno delay para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Melhora a qualidade
        useCORS: true, // Permite carregar imagens externas (Supabase)
        backgroundColor: '#0a0f0d', // Cor de fundo garantida
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ShadowTeam_PortoVitoria_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Verifique se as imagens carregaram corretamente.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- FUNÇÕES DE GERENCIAMENTO DO TIME ---
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/98 backdrop-blur-xl p-2 overflow-hidden">
      
      {/* Container Principal */}
      <div className="relative w-[98vw] h-[96vh] bg-[#0a0f0d] border border-[#006837]/30 rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* BOTÕES DE CONTROLE (TOPO DIREITO) */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          
          {/* Botão Exportar PDF */}
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="h-10 px-4 bg-[#f1c40f] text-black font-black uppercase text-[10px] tracking-widest rounded-full hover:bg-white transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-file-pdf"></i>
            )}
            {isExporting ? 'Gerando...' : 'Salvar PDF'}
          </button>

          {/* Botão Fechar */}
          <button onClick={onClose} className="h-10 w-10 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg border border-white/10">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* --- ÁREA DE IMPRESSÃO (REF) --- */}
        {/* Usamos ref aqui para o html2canvas capturar apenas esta div */}
        <div ref={printRef} className="flex-1 relative bg-[#1a2e22] overflow-hidden flex items-center justify-center p-4">
          
          {/* Título Visível Apenas no PDF (Opcional, mas útil para contexto) */}
          <div className="absolute top-4 left-6 z-10 opacity-50 pointer-events-none">
             <h2 className="font-oswald text-2xl text-white uppercase font-bold">Shadow Team <span className="text-[#f1c40f]">2025/26</span></h2>
             <p className="text-[10px] text-white uppercase tracking-widest">Departamento de Análise • {currentUser.name}</p>
          </div>

          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #000 50px)' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>

          {/* CAMPO */}
          <div className="relative w-full h-full max-w-[1600px] border-2 border-white/10 rounded-xl shadow-2xl bg-[#006837]/10 backdrop-blur-sm mx-auto my-0">
            
            {/* Linhas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-b-2 border-x-2 border-white/20 rounded-b-xl"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[10%] border-t-2 border-x-2 border-white/20 rounded-t-xl"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/10 rounded-full"></div>

            {FORMATION_SLOTS.map((slot) => {
              const playersInSlot = getPlayersInSlot(slot.id);
              const isSelected = selectingSlot === slot.id;
              
              return (
                <div 
                  key={slot.id}
                  onClick={() => setSelectingSlot(slot.id)}
                  // data-html2canvas-ignore -> Use isso se quiser esconder elementos específicos do PDF
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer flex flex-col items-center ${isSelected ? 'z-50 scale-105' : 'z-10 hover:scale-105'}`}
                  style={{ top: slot.top, left: slot.left }}
                >
                  <div className={`mb-1 px-3 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-lg ${
                    isSelected ? 'bg-[#f1c40f] text-black border-[#f1c40f]' : 'bg-black/60 text-white/50 border-white/10'
                  }`}>
                    {slot.label} <span className="text-[8px] opacity-70">({playersInSlot.length})</span>
                  </div>

                  <div className="flex flex-col gap-1 items-center min-w-[110px]">
                    {playersInSlot.length > 0 ? (
                      playersInSlot.map((player, idx) => (
                        <div key={player.id} className="relative group w-full flex justify-center">
                          <div className={`flex items-center gap-2 p-1.5 rounded-xl border shadow-xl backdrop-blur-md transition-all w-fit ${
                            idx === 0 
                              ? 'bg-[#006837]/90 border-[#006837] scale-105 z-20 shadow-[0_0_15px_rgba(0,104,55,0.5)]' 
                              : 'bg-slate-900/90 border-slate-700 scale-95 opacity-90'
                          }`}>
                             {idx === 0 && <i className="fas fa-crown text-[8px] text-[#f1c40f] absolute -left-1.5 -top-1.5 bg-black rounded-full p-1 shadow-md z-30 border border-[#f1c40f]/30"></i>}
                             
                             {/* crossOrigin="anonymous" é CRUCIAL para o PDF funcionar com imagens externas */}
                             <img 
                                src={player.photoUrl} 
                                crossOrigin="anonymous"
                                className={`${idx === 0 ? 'h-10 w-10' : 'h-7 w-7'} rounded-lg bg-black object-cover border border-white/10`} 
                             />
                             
                             <div className="flex flex-col leading-none pr-2">
                                <span className={`${idx === 0 ? 'text-[10px]' : 'text-[8px]'} font-bold text-white uppercase truncate max-w-[90px]`}>{player.name.split(' ')[0]}</span>
                                <span className="text-[7px] font-bold text-[#f1c40f] uppercase">{player.club}</span>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-10 w-10 rounded-full border-2 border-dashed border-white/20 bg-black/20 flex items-center justify-center text-white/20 hover:text-[#f1c40f] hover:border-[#f1c40f] transition-all">
                        <i className="fas fa-plus text-[10px]"></i>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SIDEBAR --- */}
        {/* data-html2canvas-ignore garante que a sidebar NÃO saia no PDF */}
        {selectingSlot && (
          <div data-html2canvas-ignore className="w-full md:w-[420px] bg-[#050807] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 z-20 absolute right-0 top-0 bottom-0 md:relative shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0f0d]">
              <div>
                <h3 className="text-[#f1c40f] font-oswald text-xl font-bold uppercase">Shadow List</h3>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">
                  Posição: <span className="text-white bg-[#006837] px-2 py-0.5 rounded ml-1 text-[10px]">{FORMATION_SLOTS.find(s => s.id === selectingSlot)?.label}</span>
                </p>
              </div>
              <button onClick={() => setSelectingSlot(null)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-5 border-b border-white/5 bg-[#0a0f0d]/50">
                <h4 className="text-[9px] font-black text-[#006837] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <i className="fas fa-list-ol"></i> Ordem de Preferência
                </h4>
                
                <div className="space-y-2">
                  {getPlayersInSlot(selectingSlot).map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1a2e22]/40 border border-[#006837]/30 group transition-all hover:bg-[#1a2e22]/60 hover:shadow-lg">
                      <div className="flex flex-col items-center justify-center w-5 text-xs font-black text-[#f1c40f]">
                        {idx + 1}º
                      </div>
                      <img src={p.photoUrl} className="h-9 w-9 rounded-lg object-cover bg-black" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold text-white uppercase truncate">{p.name}</h4>
                        <span className="text-[8px] text-slate-500 uppercase">{p.club}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <>
                            <button onClick={() => promoteToStarter(selectingSlot, idx)} title="Tornar Titular" className="h-6 w-6 rounded bg-[#f1c40f] text-black text-[9px] flex items-center justify-center hover:scale-110 transition-transform">
                              <i className="fas fa-crown"></i>
                            </button>
                            <button onClick={() => movePlayer(selectingSlot, idx, idx - 1)} className="h-6 w-6 rounded bg-slate-800 text-slate-300 text-[9px] flex items-center justify-center hover:bg-white hover:text-black">
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          </>
                        )}
                        {idx < getPlayersInSlot(selectingSlot).length - 1 && (
                          <button onClick={() => movePlayer(selectingSlot, idx, idx + 1)} className="h-6 w-6 rounded bg-slate-800 text-slate-300 text-[9px] flex items-center justify-center hover:bg-white hover:text-black">
                            <i className="fas fa-arrow-down"></i>
                          </button>
                        )}
                        <button onClick={() => removePlayer(selectingSlot, p.id)} className="h-6 w-6 rounded bg-red-600/20 text-red-500 text-[9px] flex items-center justify-center hover:bg-red-600 hover:text-white ml-1">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {getPlayersInSlot(selectingSlot).length === 0 && (
                    <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Vazio</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <i className="fas fa-search"></i> Banco de Atletas
                </h4>
                
                <div className="relative mb-3">
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-xs text-white outline-none focus:border-[#f1c40f] transition-all"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                </div>

                <div className="space-y-2">
                  {searchResults.map(p => (
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
                  ))}
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