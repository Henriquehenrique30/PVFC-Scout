
import React, { useState, useRef } from 'react';
import { Player, Position, PlayerStats, Recommendation } from '../types';
import * as XLSX from 'xlsx';

interface AddPlayerModalProps {
  player?: Player;
  onClose: () => void;
  onAdd: (player: Player) => void;
  onUpdate: (player: Player) => void;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ player, onClose, onAdd, onUpdate }) => {
  const isEditing = !!player;

  const [name, setName] = useState(player?.name || '');
  const [club, setClub] = useState(player?.club || '');
  const [birthDate, setBirthDate] = useState(player?.birthDate || '2005-01-01');
  const [gamesWatched, setGamesWatched] = useState(player?.gamesWatched || 0);
  const [position1, setPosition1] = useState<Position>(player?.position1 || Position.ATA);
  const [position2, setPosition2] = useState<Position | ''>(player?.position2 || '');
  const [recommendation, setRecommendation] = useState<Recommendation>(player?.recommendation || 'G3 Monitoramento');
  const [competition, setCompetition] = useState(player?.competition || '');
  const [scoutYear, setScoutYear] = useState(player?.scoutYear || new Date().getFullYear());
  const [photoUrl, setPhotoUrl] = useState<string | null>(player?.photoUrl || null);
  const [aiContextData, setAiContextData] = useState<string>(player?.aiContextData || '');
  const [videoUrl, setVideoUrl] = useState(player?.videoUrl || '');
  const [ogolUrl, setOgolUrl] = useState(player?.ogolUrl || '');
  const [agent, setAgent] = useState(player?.agent || '');
  const [contact, setContact] = useState(player?.contact || '');
  const [height, setHeight] = useState(player?.height || 180);
  const [foot, setFoot] = useState<'Left' | 'Right' | 'Both'>(player?.foot || 'Right');
  const [fileName, setFileName] = useState<string | null>(player?.aiContextData ? 'Dados de IA Carregados' : null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<PlayerStats>(player?.stats || {
    pace: 3, shooting: 3, passing: 3, dribbling: 3, defending: 3, physical: 3,
  });

  const handleGenerateAvatar = () => {
    const seed = name ? encodeURIComponent(name) : Math.random().toString();
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=0f172a&shirtColor=006837`;
    setPhotoUrl(avatarUrl);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDataFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_csv(ws);
          setAiContextData(data.slice(0, 10000)); 
        } catch (err) {
          alert("Erro no arquivo.");
        }
      };
      if (file.name.endsWith('.csv')) reader.readAsText(file);
      else reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cálculo preciso da idade (considerando aniversário)
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    const updatedPlayerData: Player = {
      id: player?.id || Date.now().toString(),
      name, age, birthDate, position1,
      position2: position2 === '' ? undefined : (position2 as Position),
      club, value: 0, recommendation,
      competition: competition || 'Não informada',
      scoutYear, gamesWatched, nationality: 'Brasil',
      photoUrl: photoUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${name || 'anon'}`,
      stats, foot, height, contractUntil: 2027,
      aiContextData, videoUrl, ogolUrl, agent, contact
    };
    if (isEditing) onUpdate(updatedPlayerData);
    else onAdd(updatedPlayerData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-5xl my-8 overflow-hidden rounded-[2.5rem] bg-[#0a0f0d] border border-[#006837]/30 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-[#0f1a16] px-8 py-6 flex justify-between items-center border-b border-[#006837]/20">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#006837]/30 ${isEditing ? 'bg-[#f1c40f]/20 text-[#f1c40f]' : 'bg-[#006837]/20 text-[#006837]'}`}>
              <i className={`fas ${isEditing ? 'fa-edit' : 'fa-user-plus'}`}></i>
            </div>
            <div>
              <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-white">
                {isEditing ? `Editar Atleta: ${player.name}` : 'Novo Atleta no Porto Vitória'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            
            {/* COLUNA ESQUERDA: FOTO E STATS */}
            <div className="md:col-span-4 space-y-8">
              <section>
                <label className="block text-[10px] font-black text-[#006837] uppercase tracking-widest mb-3">Identidade Visual</label>
                <div className="relative group h-64 w-full rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-[#f1c40f]/30">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                       <i className="fas fa-camera text-4xl text-slate-700 mb-2"></i>
                       <p className="text-[8px] font-bold text-slate-600 uppercase">Selecione ou Gere um Avatar</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase rounded-lg">Upload Foto</button>
                    <button type="button" onClick={handleGenerateAvatar} className="px-4 py-2 bg-[#f1c40f] text-black text-[9px] font-black uppercase rounded-lg">Gerar Caricatura</button>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </section>

              <section className="bg-black/40 rounded-3xl p-6 border border-[#006837]/10">
                <h3 className="text-[10px] font-black text-[#f1c40f] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <i className="fas fa-chart-line"></i> Atributos (1-5)
                </h3>
                <div className="space-y-4">
                  {Object.keys(stats).map((key) => (
                    <div key={key}>
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-2">
                        <span>{key === 'pace' ? 'Ritmo' : key === 'shooting' ? 'Finalização' : key === 'passing' ? 'Passe' : key === 'dribbling' ? 'Drible' : key === 'defending' ? 'Defesa' : 'Físico'}</span>
                        <span className="text-white bg-[#006837] px-2 rounded">{stats[key as keyof PlayerStats]}</span>
                      </div>
                      <input 
                        type="range" min="1" max="5" step="1"
                        value={stats[key as keyof PlayerStats]}
                        onChange={e => setStats(prev => ({...prev, [key]: parseInt(e.target.value)}))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#f1c40f]"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* COLUNA DIREITA: DADOS COMPLETOS */}
            <div className="md:col-span-8 space-y-10">
              
              {/* BLOCO 1: IDENTIFICAÇÃO E CAMPO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nome Completo do Atleta</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#f1c40f] outline-none transition-all" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Clube Atual</label>
                  <input required type="text" value={club} onChange={e => setClub(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#006837] outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Qualificação (Recomendação)</label>
                  <select value={recommendation} onChange={e => setRecommendation(e.target.value as Recommendation)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#f1c40f] outline-none">
                    <option value="G1 Elite">G1 - Elite Porto Vitória</option>
                    <option value="G2 Titular">G2 - Potencial Titular</option>
                    <option value="G3 Monitoramento">G3 - Monitoramento</option>
                    <option value="Base">Base - Projeção Futura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Posição Principal</label>
                  <select value={position1} onChange={e => setPosition1(e.target.value as Position)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none">
                    {Object.values(Position).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Data de Nascimento</label>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Perna Dominante</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Right', 'Left', 'Both'].map((f) => (
                      <button
                        key={f} type="button"
                        onClick={() => setFoot(f as any)}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                          foot === f ? 'bg-[#006837] border-[#006837] text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {f === 'Right' ? 'Destro' : f === 'Left' ? 'Canhoto' : 'Ambi.'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Altura (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none" />
                </div>
              </div>

              {/* BLOCO 2: DADOS DE SCOUT */}
              <div className="bg-white/5 rounded-3xl p-8 space-y-6 border border-white/5">
                <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-[0.3em] flex items-center gap-2">
                  <i className="fas fa-clipboard-check"></i> Histórico de Avaliação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Liga / Competição Avaliada</label>
                    <input type="text" value={competition} onChange={e => setCompetition(e.target.value)} placeholder="Ex: Paulistão Sub-20" className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none focus:border-[#006837]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Temporada</label>
                      <input type="number" value={scoutYear} onChange={e => setScoutYear(parseInt(e.target.value))} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Jogos Assistidos</label>
                      <input type="number" value={gamesWatched} onChange={e => setGamesWatched(parseInt(e.target.value))} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCO 3: MERCADO E ANALÍTICA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Agente / Representante</label>
                  <input type="text" value={agent} onChange={e => setAgent(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none focus:border-[#f1c40f]" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Contato / Telefone</label>
                  <input type="text" value={contact} onChange={e => setContact(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-[#f1c40f] uppercase mb-2 tracking-widest">Relatório Técnico IA (Anexar Excel/CSV)</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => dataInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 rounded-2xl border border-dashed border-[#f1c40f]/40 p-5 text-[10px] text-white font-black uppercase hover:bg-[#f1c40f]/5 transition-all">
                      <i className="fas fa-file-excel text-lg text-[#f1c40f]"></i>
                      {fileName || "Carregar Dados Métricos"}
                    </button>
                    {aiContextData && (
                      <button type="button" onClick={() => {setAiContextData(''); setFileName(null);}} className="bg-red-600/20 text-red-500 px-6 rounded-2xl border border-red-600/30 hover:bg-red-600 hover:text-white transition-all">
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <input type="file" ref={dataInputRef} onChange={handleDataFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="URL do Vídeo (Youtube/Vimeo)" className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-[11px] text-white outline-none" />
                  <input type="text" value={ogolUrl} onChange={e => setOgolUrl(e.target.value)} placeholder="URL Perfil oGol" className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-[11px] text-white outline-none" />
                </div>
              </div>

              {/* AÇÕES FINAIS */}
              <div className="pt-10 flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800 rounded-3xl hover:bg-white/5 transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-[#006837] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-[#008a4a] shadow-2xl shadow-[#006837]/30 transition-all">
                  {isEditing ? 'Confirmar Atualização' : 'Finalizar Cadastro Porto'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlayerModal;
