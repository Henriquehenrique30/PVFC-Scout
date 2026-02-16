
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExternalProject, ObservationSchedule, ObservationPeriod } from '../types';
import { dbService, isCloudActive } from '../services/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExternalScoutingPageProps {
  onBack: () => void;
}

const ExternalScoutingPage: React.FC<ExternalScoutingPageProps> = ({ onBack }) => {
  const [projects, setProjects] = useState<ExternalProject[]>([]);
  const [schedules, setSchedules] = useState<ObservationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [projectName, setProjectName] = useState('');
  const [projectCity, setProjectCity] = useState(''); 
  const [projectPhone, setProjectPhone] = useState('');
  const [projectResponsible, setProjectResponsible] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [observationDate, setObservationDate] = useState('');
  const [observationPeriod, setObservationPeriod] = useState<ObservationPeriod>('Manhã');
  const [observerName, setObserverName] = useState('');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, schedulesData] = await Promise.all([
        dbService.getExternalProjects(),
        dbService.getObservationSchedules()
      ]);
      setProjects(projectsData);
      setSchedules(schedulesData);
      if (projectsData.length > 0 && !selectedProjectId) setSelectedProjectId(projectsData[0].id);
    } catch (err) {
      console.error("Erro Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectResponsible || !projectCity) return;
    setIsSaving(true);
    try {
      await dbService.saveExternalProject({
        id: crypto.randomUUID(),
        name: projectName,
        city: projectCity,
        phone: projectPhone,
        responsible: projectResponsible,
        created_at: new Date().toISOString()
      });
      setProjectName(''); setProjectCity(''); setProjectPhone(''); setProjectResponsible('');
      await loadData();
    } finally { setIsSaving(false); }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !observationDate || !observerName) return;
    setIsSaving(true);
    const project = projects.find(p => p.id === selectedProjectId);
    try {
      await dbService.saveObservationSchedule({
        id: crypto.randomUUID(),
        project_id: selectedProjectId,
        project_name: project?.name || '',
        city: project?.city || '',
        date: observationDate,
        period: observationPeriod,
        observer_name: observerName,
        created_at: new Date().toISOString()
      });
      setObserverName('');
      await loadData();
    } finally { setIsSaving(false); }
  };

  const filteredSchedules = useMemo(() => {
    let result = [...schedules];
    if (filterStartDate) result = result.filter(s => s.date >= filterStartDate);
    if (filterEndDate) result = result.filter(s => s.date <= filterEndDate);
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [schedules, filterStartDate, filterEndDate]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Relatorio_Agenda_Externa.pdf`);
    } finally { setIsExporting(false); }
  };

  return (
    <div className="min-h-screen bg-[#020403] text-white flex flex-col font-inter">
      <header className="glass-panel border-b border-white/5 py-4 px-8 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#f1c40f] hover:text-black transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="font-oswald text-xl font-bold uppercase tracking-tight">Captação <span className="text-[#f1c40f]">Externa</span></h1>
          </div>
          <button onClick={handleExportPDF} disabled={isExporting} className="h-10 px-6 rounded-xl bg-[#006837] text-[9px] font-black uppercase text-white hover:bg-[#f1c40f] hover:text-black transition-all shadow-xl flex items-center gap-2">
            {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
            Gerar Relatório
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-[#f1c40f] uppercase tracking-widest">Novo Projeto</h3>
            <form onSubmit={handleAddProject} className="space-y-3">
              <input type="text" placeholder="Projeto" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" />
              <input type="text" placeholder="Cidade" value={projectCity} onChange={e => setProjectCity(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" />
              <input type="text" placeholder="Responsável" value={projectResponsible} onChange={e => setProjectResponsible(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" />
              <button type="submit" className="w-full py-3 bg-[#006837] rounded-xl text-[9px] font-black uppercase tracking-widest">Salvar</button>
            </form>
          </section>

          <section className="glass-panel p-6 rounded-[2rem] border border-[#006837]/30 space-y-4">
            <h3 className="text-[10px] font-black text-[#006837] uppercase tracking-widest">Agendar</h3>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              </select>
              <input type="date" value={observationDate} onChange={e => setObservationDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs" />
              <select value={observationPeriod} onChange={e => setObservationPeriod(e.target.value as ObservationPeriod)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs">
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
              <input type="text" placeholder="Observador" value={observerName} onChange={e => setObserverName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs" />
              <button type="submit" className="w-full py-3 bg-[#f1c40f] text-black rounded-xl text-[9px] font-black uppercase tracking-widest">Agendar</button>
            </form>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* SELETOR DE PERÍODO DO RELATÓRIO */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
              <input 
                type="date" 
                value={filterStartDate} 
                onChange={e => setFilterStartDate(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#f1c40f]" 
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Fim</label>
              <input 
                type="date" 
                value={filterEndDate} 
                onChange={e => setFilterEndDate(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#f1c40f]" 
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-[8px] font-black uppercase text-slate-500 hover:text-white transition-all"
              >
                Limpar
              </button>
            </div>
          </div>

          <div ref={reportRef} className="bg-white text-black p-12 rounded-[2rem] shadow-2xl min-h-[800px]">
            <div className="text-center mb-10 border-b-4 border-[#006837] pb-8">
               <img src="https://cdn-img.zerozero.pt/img/logos/equipas/102019_imgbank.png" className="h-24 mx-auto mb-4" />
               <h1 className="text-3xl font-oswald font-bold uppercase text-[#006837]">Departamento de Captação</h1>
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Agenda de Observação Externa</p>
               {/* Indicação do período no PDF se filtrado */}
               {(filterStartDate || filterEndDate) && (
                 <p className="text-[10px] font-black text-[#006837] uppercase tracking-[0.2em] mt-3">
                   Período: {filterStartDate ? new Date(filterStartDate + 'T00:00:00').toLocaleDateString() : 'Início'} — {filterEndDate ? new Date(filterEndDate + 'T00:00:00').toLocaleDateString() : 'Atual'}
                 </p>
               )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-500 tracking-widest">
                <div className="col-span-2">Data</div>
                <div className="col-span-2">Período</div>
                <div className="col-span-3">Projeto / Unidade</div>
                <div className="col-span-2">Cidade</div>
                <div className="col-span-3">Observador</div>
              </div>
              {filteredSchedules.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 px-6 py-5 border-b border-slate-100 items-center">
                  <div className="col-span-2 font-bold text-slate-800 text-[11px]">{new Date(item.date + 'T00:00:00').toLocaleDateString()}</div>
                  <div className="col-span-2 text-[10px] font-black uppercase text-blue-600">{item.period}</div>
                  <div className="col-span-3 font-black uppercase text-[#006837] text-[11px] break-words">{item.project_name}</div>
                  <div className="col-span-2 font-bold text-slate-700 uppercase text-[10px] break-words">{item.city}</div>
                  <div className="col-span-3 font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span className="text-[10px] break-words">{item.observer_name}</span>
                    <button onClick={() => dbService.deleteObservationSchedule(item.id).then(loadData)} className="text-red-500 opacity-0 hover:opacity-100 p-1" data-html2canvas-ignore>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {filteredSchedules.length === 0 && <p className="text-center py-20 text-slate-300 uppercase font-black text-[10px]">Sem agendamentos no período selecionado</p>}
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Porto Vitória Futebol Clube • Documento Oficial</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExternalScoutingPage;
