
import React, { useState } from 'react';
import { User, UserRole, Player } from '../types';

interface AdminUserManagementProps {
  users: User[];
  players: Player[];
  onUpdateStatus: (userId: string, status: 'approved' | 'rejected') => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onClose: () => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, players, onUpdateStatus, onUpdateUser, onDeleteUser, onClose }) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'database'>('pending');

  const pendingUsers = users.filter(u => u.status === 'pending');
  
  const handlePasswordChange = (user: User) => {
    if (!newPassword.trim()) return;
    onUpdateUser({ ...user, password: newPassword });
    setNewPassword('');
    setEditingUserId(null);
    alert(`Senha de ${user.username} alterada com sucesso.`);
  };

  const handleToggleRole = (user: User) => {
    const nextRole: UserRole = user.role === 'admin' ? 'scout' : 'admin';
    if(window.confirm(`Mudar nível de acesso de ${user.username} para ${nextRole.toUpperCase()}?`)) {
      onUpdateUser({ ...user, role: nextRole });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Dados copiados para a área de transferência!");
  };

  const renderUserList = (list: User[]) => (
    <div className="space-y-4">
      {list.map(user => (
        <div key={user.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 transition-all hover:border-[#006837]/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-bold flex items-center gap-2">
                {user.name} 
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-[#f1c40f] text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {user.role}
                </span>
              </h4>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">Login: <span className="text-[#006837] font-bold">{user.username}</span></p>
            </div>
            
            <div className="flex gap-2">
              {user.status === 'pending' ? (
                <>
                  <button onClick={() => onUpdateStatus(user.id, 'rejected')} className="px-3 py-1.5 rounded-lg bg-red-600/10 text-red-500 text-[9px] font-black uppercase">Recusar</button>
                  <button onClick={() => onUpdateStatus(user.id, 'approved')} className="px-3 py-1.5 rounded-lg bg-[#006837] text-white text-[9px] font-black uppercase">Aprovar</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleToggleRole(user)} className="p-2 text-slate-500 hover:text-[#f1c40f] transition-colors" title="Mudar Acesso"><i className="fas fa-user-shield text-xs"></i></button>
                  <button onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)} className="p-2 text-slate-500 hover:text-[#f1c40f] transition-colors" title="Trocar Senha"><i className="fas fa-key text-xs"></i></button>
                  <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Excluir Login"><i className="fas fa-trash-alt text-xs"></i></button>
                </>
              )}
            </div>
          </div>

          {editingUserId === user.id && (
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 animate-in slide-in-from-top-2">
              <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova Senha" className="flex-1 rounded-lg bg-black border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#f1c40f]" />
              <button onClick={() => handlePasswordChange(user)} className="px-4 py-2 bg-[#f1c40f] text-slate-950 rounded-lg text-[9px] font-black uppercase">Salvar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2.5rem] bg-[#0a0f0d] border border-[#006837]/30 shadow-2xl">
        <div className="bg-[#0f1a16] px-8 py-6 flex justify-between items-center border-b border-[#006837]/20">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1c40f]/20 text-[#f1c40f]">
              <i className="fas fa-users-cog"></i>
            </div>
            <div>
              <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-white">Central de Administração</h2>
              <p className="text-[9px] font-black text-[#006837] uppercase tracking-[0.3em]">Gestão de Mercado Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5">
             <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="px-8 pt-6">
           <div className="flex border-b border-white/5 gap-6">
              <button onClick={() => setActiveTab('pending')} className={`pb-3 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'pending' ? 'text-[#f1c40f]' : 'text-slate-600'}`}>
                Pendentes ({pendingUsers.length})
                {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f1c40f]"></div>}
              </button>
              <button onClick={() => setActiveTab('all')} className={`pb-3 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'all' ? 'text-[#f1c40f]' : 'text-slate-600'}`}>
                Logins ({users.length})
                {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f1c40f]"></div>}
              </button>
              <button onClick={() => setActiveTab('database')} className={`pb-3 text-[10px] font-black uppercase tracking-widest relative ${activeTab === 'database' ? 'text-[#f1c40f]' : 'text-slate-600'}`}>
                Base de Dados (RAW)
                {activeTab === 'database' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#f1c40f]"></div>}
              </button>
           </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'database' ? (
            <div className="space-y-8">
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-black uppercase text-[#006837] tracking-widest">Base de Jogadores (JSON)</h3>
                  <button onClick={() => copyToClipboard(JSON.stringify(players))} className="text-[9px] bg-slate-800 text-white px-3 py-1 rounded hover:bg-[#f1c40f] hover:text-black transition-all">Copiar Tudo</button>
                </div>
                <div className="bg-black p-4 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-500 h-40 overflow-y-auto break-all">
                  {JSON.stringify(players)}
                </div>
                <p className="text-[8px] text-slate-600 mt-2 uppercase">Atenção: Este é o código bruto dos atletas. Útil para backup manual.</p>
              </section>

              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-black uppercase text-[#f1c40f] tracking-widest">Base de Usuários/Logins (JSON)</h3>
                  <button onClick={() => copyToClipboard(JSON.stringify(users))} className="text-[9px] bg-slate-800 text-white px-3 py-1 rounded hover:bg-[#f1c40f] hover:text-black transition-all">Copiar Tudo</button>
                </div>
                <div className="bg-black p-4 rounded-xl border border-slate-800 text-[10px] font-mono text-amber-500 h-40 overflow-y-auto break-all">
                  {JSON.stringify(users)}
                </div>
                <p className="text-[8px] text-slate-600 mt-2 uppercase">Atenção: Contém as credenciais de acesso do sistema.</p>
              </section>
            </div>
          ) : (
            renderUserList(activeTab === 'pending' ? pendingUsers : users)
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
