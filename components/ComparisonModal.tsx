import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { comparePlayersWithAI, ComparisonCandidate } from '../services/geminiService';

interface ComparisonModalProps {
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ onClose }) => {
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Validação: Nome Obrigatório
    if (!currentName.trim()) {
      alert("⚠️ Digite o nome do jogador ANTES de carregar o arquivo.");
      if (e.target) e.target.value = ''; // Limpa o input file para tentar de novo
      return;
    }

    if (!file) return;

    if (candidates.length >= 5) {
      alert("Máximo de 5 jogadores permitidos.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert("O arquivo parece vazio ou inválido.");
          return;
        }

        const newCandidate: ComparisonCandidate = {
          id: Date.now().toString(),
          name: currentName,
          data: data
        };

        setCandidates([...candidates, newCandidate]);
        setCurrentName(''); // Limpa o nome para o próximo
        if (e.target) e.target.value = ''; // Reseta input file
      } catch (err) {
        console.error(err);
        alert("Erro ao ler arquivo Excel/CSV.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const runComparison = async () => {
    if (candidates.length < 2) {
      alert("Adicione pelo menos 2 jogadores para comparar.");
      return;
    }
    
    setLoading(true);
    try {
      const result = await comparePlayersWithAI(candidates);
      setReport(result);
    } catch (error) {
      alert("Erro ao conectar com a IA.");
    } finally {
      setLoading(false);
    }
  };

  // Renderizador simples de Markdown
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-[#f1c40f] text-xl font-bold mt-6 mb-3 uppercase border-b border-[#f1c40f]/20 pb-1">{line.replace('## ', '')}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="text-white text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h4>;
        if (line.trim().startsWith('|')) return <p key={i} className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap bg-black/20 p-1 rounded my-1">{line}</p>; // Tentativa simples de tabela
        
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={i} className="text-slate-300 text-sm mb-1 leading-relaxed">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/98 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-7xl h-[90vh] bg-[#0a0f0d] border border-[#006837]/30 rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 h-10 w-10 bg-slate-900 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center border border-white/10 shadow-lg">
          <i className="fas fa-times"></i>
        </button>

        {/* --- COLUNA ESQUERDA: INPUTS --- */}
        <div className="w-full md:w-[400px] bg-[#050807] border-r border-white/5 p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="mb-8">
             <h2 className="font-oswald text-2xl font-bold uppercase text-white">Data <span className="text-[#f1c40f]">Lab</span></h2>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Groq AI Analytics • Comparador</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 mb-6">
             <label className="block text-[9px] font-black text-[#006837] uppercase tracking-widest mb-2">1. Nome do Jogador</label>
             <input 
               type="text" 
               value={currentName}
               onChange={e => setCurrentName(e.target.value)}
               placeholder="Ex: Novo Reforço"
               className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#f1c40f] mb-4 transition-all"
             />

             <label className="block text-[9px] font-black text-[#006837] uppercase tracking-widest mb-2">2. Upload Dados (Excel/CSV)</label>
             <label className={`flex items-center justify-center w-full h-12 border border-dashed rounded-xl cursor-pointer transition-all group ${!currentName ? 'bg-slate-900 border-slate-700 opacity-50 cursor-not-allowed' : 'bg-[#f1c40f]/10 border-[#f1c40f]/30 hover:bg-[#f1c40f]/20'}`}>
                <span className={`text-[9px] font-black uppercase transition-transform ${!currentName ? 'text-slate-600' : 'text-[#f1c40f] group-hover:scale-105'}`}>
                   <i className="fas fa-upload mr-2"></i> {!currentName ? 'Preencha o nome primeiro' : 'Selecionar Arquivo'}
                </span>
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} disabled={!currentName} className="hidden" />
             </label>
          </div>

          <div className="flex-1 mb-6">
             <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                Candidatos <span className="text-white bg-slate-800 px-2 rounded-full">{candidates.length}/5</span>
             </h4>
             <div className="space-y-2">
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1a2e22]/40 border border-[#006837]/30 animate-in slide-in-from-left-2">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#006837]/20 flex items-center justify-center text-[#006837]">
                           <i className="fas fa-file-csv"></i>
                        </div>
                        <div className="min-w-0">
                           <p className="text-[10px] font-bold text-white uppercase truncate">{c.name}</p>
                           <p className="text-[8px] text-slate-500 uppercase font-bold">Dados prontos</p>
                        </div>
                     </div>
                     <button onClick={() => removeCandidate(c.id)} className="h-6 w-6 rounded bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors">
                        <i className="fas fa-trash text-[10px]"></i>
                     </button>
                  </div>
                ))}
                {candidates.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl opacity-50">
                    <p className="text-[9px] text-slate-500 uppercase font-black">Lista Vazia</p>
                  </div>
                )}
             </div>
          </div>

          <div className="mt-auto">
             <button 
               onClick={runComparison}
               disabled={loading || candidates.length < 2}
               className="w-full py-4 rounded-xl bg-[#006837] text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#008a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg border border-[#006837]/50"
             >
               {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
               {loading ? 'Processando IA...' : 'Comparar Dados'}
             </button>
          </div>
        </div>

        {/* --- COLUNA DIREITA: RESULTADO --- */}
        <div className="flex-1 bg-[#0a0f0d] p-8 overflow-y-auto custom-scrollbar relative">
           {/* Background Texture */}
           <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#006837 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           {report ? (
             <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                   <div className="h-12 w-12 rounded-xl bg-[#f1c40f]/10 flex items-center justify-center text-[#f1c40f] text-2xl border border-[#f1c40f]/20">
                      <i className="fas fa-balance-scale"></i>
                   </div>
                   <div>
                      <h2 className="text-2xl font-oswald font-bold text-white uppercase">Veredicto dos Dados</h2>
                      <p className="text-[10px] text-[#006837] font-black uppercase tracking-widest">Comparativo Estatístico Oficial • Groq Llama 3</p>
                   </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                   {renderMarkdown(report)}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-40">
                <i className="fas fa-chart-bar text-7xl mb-6"></i>
                <p className="text-xs font-black uppercase tracking-widest text-center">
                  Adicione jogadores e inicie<br/>a batalha de dados
                </p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ComparisonModal;