
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
  const [birthDate, setBirthDate] = useState(player?.birthDate || '2000-01-01');
  const [gamesWatched, setGamesWatched] = useState(player?.gamesWatched || 1);
  const [position1, setPosition1] = useState<Position>(player?.position1 || Position.CM);
  const [position2, setPosition2] = useState<Position | ''>(player?.position2 || '');
  const [recommendation, setRecommendation] = useState<Recommendation>(player?.recommendation || 'G1 Elite');
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
  const [isParsing, setIsParsing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<PlayerStats>(player?.stats || {
    pace: 3, shooting: 3, passing: 3, dribbling: 3, defending: 3, physical: 3,
  });

  // Gera um avatar estilo caricatura profissional usando o serviço DiceBear
  const handleGenerateAvatar = () => {
    // Usamos o estilo 'notionists' que tem um aspecto de caricatura moderna e profissional
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
      setIsParsing(true);
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
        } finally {
          setIsParsing(false);
        }
      };
      if (file.name.endsWith('.csv')) reader.readAsText(file);
      else reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2.5rem] bg-[#0a0f0d] border border-[#006837]/30 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-[#0f1a16] px-8 py-6 flex justify-between items-center border-b border-[#006837]/20">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#006837]/30 ${isEditing ? 'bg-[#f1c40f]/20 text-[#f1c40f]' : 'bg-[#006837]/20 text-[#006837]'}`}>
              <i className={`fas ${isEditing ? 'fa-edit' : 'fa-user-plus'}`}></i>
            </div>
            <div>
              <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-white">
                {isEditing ? `Editar: ${player.name}` : 'Cadastro de Atleta'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-4 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Foto ou Caricatura</label>
                <div 
                  className={`relative group h-52 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-900/50 ${
                    photoUrl ? 'border-[#006837]' : 'border-slate-800'
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <i className="fas fa-user-circle text-4xl text-slate-700"></i>
                       <span className="text-[8px] font-bold text-slate-600 uppercase">Sem Foto</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                   <button 
                    type="button" onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white uppercase hover:bg-white hover:text-black transition-all"
                   >
                     Upload Foto
                   </button>
                   <button 
                    type="button" onClick={handleGenerateAvatar}
                    className="py-2.5 rounded-lg bg-[#006837]/20 border border-[#006837]/40 text-[9px] font-black text-[#f1c40f] uppercase hover:bg-[#f1c40f] hover:text-black transition-all flex items-center justify-center gap-2"
                   >
                     <i className="fas fa-palette"></i> Avatar Porto
                   </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <div className="bg-[#0f1a16] rounded-2xl p-6 border border-[#006837]/10 space-y-4">
                <h3 className="text-[10px] font-black text-[#f1c40f] uppercase tracking-widest mb-2 border-b border-[#006837]/20 pb-3">Atributos Técnicos</h3>
                {Object.keys(stats).map((key) => (
                  <div key={key}>
                    <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mb-1">
                      <span>{key}</span>
                      <span className="text-[#f1c40f]">{stats[key as keyof PlayerStats]}</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" step="1"
                      value={stats[key as keyof PlayerStats]}
                      onChange={e => setStats(prev => ({...prev, [key]: parseInt(e.target.value)}))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#006837]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nome do Atleta</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#006837] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Clube Atual</label>
                  <input required type="text" value={club} onChange={e => setClub(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#006837] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Posição</label>
                  <select value={position1} onChange={e => setPosition1(e.target.value as Position)} className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white outline-none">
                    {Object.values(Position).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Data de Nascimento</label>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#006837] uppercase mb-2 tracking-widest">Relatório Técnico (Excel/CSV)</label>
                  <button type="button" onClick={() => dataInputRef.current?.click()} className="w-full rounded-xl border border-dashed border-[#006837]/30 p-4 text-[10px] text-slate-400 font-bold uppercase hover:bg-[#006837]/5 transition-all">
                    {fileName || "Anexar Dados"}
                  </button>
                  <input type="file" ref={dataInputRef} onChange={handleDataFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
                </div>
              </div>

              <div className="pt-10 flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800 rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-[#006837] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#008a4a] shadow-xl">Salvar Atleta</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlayerModal;
