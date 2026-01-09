
import React, { useState, useEffect, useRef } from 'react';
import { ObservedPlayer, Position } from '../types';

interface WatchlistPageProps {
  onBack: () => void;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onBack }) => {
  const STORAGE_KEY = 'pvfc_watchlist_data';
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const [list, setList] = useState<ObservedPlayer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [position, setPosition] = useState<Position>(Position.ATA);

  // Sincroniza com localStorage sempre que a lista mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !club.trim()) {
      alert("Preencha o nome e o clube.");
      return;
    }

    const newItem: ObservedPlayer = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      club: club.trim(),
      position: position,
      createdAt: new Date().toISOString()
    };

    setList(prev => [newItem, ...prev]);
    setName('');
    setClub('');
  };

  const handleRemove = (id: string) => {
    if (window.confirm("Remover este atleta do radar?")) {
      setList(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleExport = () => {
    if (list.length === 0) {
      alert("A lista está vazia para exportar.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Watchlist_PVFC_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target?.result as string);
        if (Array.isArray(importedData)) {
          // Merge simples evitando duplicatas por ID
          setList(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = importedData.filter(p => !existingIds.has(p.id));
            return [...newOnes, ...prev];
          });
          alert(`${importedData.length} atletas processados com sucesso!`);
        }
      } catch (err) {
        alert("Erro ao ler arquivo JSON. Formato inválido.");
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={importInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
      />

      {/* Header específico */}
      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black transition-all"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="font-oswald text-2xl font-bold uppercase tracking-tight">Watchlist <span className="text-[#006837]">Monitor</span></h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Observação Rápida • Porto Vitória FC</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => importInputRef.current?.click()}
              className="bg-white/5 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all border border-white/5 flex items-center gap-2"
            >
              <i className="fas fa-file-import"></i> Importar
            </button>
            <button 
              onClick={handleExport}
              className="bg-[#f1c40f]/10 px-4 py-2 rounded-lg text-[9px] font-black uppercase text-[#f1c40f] hover:bg-[#f1c40f] hover:text-black transition-all border border-[#f1c40f]/20 flex items-center gap-2"
            >
              <i className="fas fa-file-export"></i> Exportar
            </button>
            <div className="h-8 w-px bg-white/5 mx-2"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10 hidden sm:block">
              {list.length} Atletas
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow mx-auto max-w-5xl w-full p-8 space-y-10">
        
        {/* Formulário de Cadastro Rápido */}
        <section className="glass-panel p-8 rounded-[2rem] border border-[#006837]/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <i className="fas fa-binoculars text-8xl text-[#006837]"></i>
          </div>
          
          <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle"></i> Novo Registro em Radar
          </h3>

          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 relative z-10">
            <div className="flex-grow">
              <input 
                required
                type="text" 
                placeholder="Nome do Atleta"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:border-[#f1c40f] transition-all"
              />
            </div>
            <div className="flex-grow">
              <input 
                required
                type="text" 
                placeholder="Clube / Origem"
                value={club}
                onChange={e => setClub(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-sm text-white outline-none focus:border-[#006837] transition-all"
              />
            </div>
            <div className="w-full md:w-32">
              <select 
                value={position}
                onChange={e => setPosition(e.target.value as Position)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#f1c40f] cursor-pointer appearance-none"
              >
                {Object.values(Position).map(pos => (
                  <option key={pos} value={pos} className="bg-slate-900">{pos}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              className="bg-[#006837] text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f1c40f] hover:text-black transition-all shadow-lg active:scale-95"
            >
              Adicionar
            </button>
          </form>
        </section>

        {/* Lista de Atletas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Radar Ativo</h3>
             <p className="text-[8px] text-slate-700 italic uppercase">Salvamento Automático Local</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {list.length > 0 ? (
              list.map(item => (
                <div 
                  key={item.id} 
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#006837]/30 transition-all hover:bg-white/[0.07] animate-in slide-in-from-top-2"
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#006837] to-[#0a0f0d] flex items-center justify-center text-[#f1c40f] font-black shadow-lg shrink-0">
                      {item.position}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white uppercase truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.club}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                       <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Registrado em</p>
                       <p className="text-[9px] font-medium text-slate-500">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="h-10 w-10 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center glass-panel rounded-[2rem] border-dashed border-white/5">
                 <i className="fas fa-eye-slash text-4xl text-slate-800 mb-4"></i>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Sua Watchlist está vazia</p>
                 <p className="text-[8px] text-slate-700 uppercase mt-1">Insira atletas acima ou importe um backup JSON</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="py-8 border-t border-white/5 text-center">
         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
           © Porto Vitória FC • Watchlist Dinâmica • Versão Local
         </p>
      </footer>
    </div>
  );
};

export default WatchlistPage;
