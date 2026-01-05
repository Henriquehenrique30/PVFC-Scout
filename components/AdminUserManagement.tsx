
import React from 'react';
import { User } from '../types';

interface AdminUserManagementProps {
  users: User[];
  onUpdateStatus: (userId: string, status: 'approved' | 'rejected') => void;
  onClose: () => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, onUpdateStatus, onClose }) => {
  const pendingUsers = users.filter(u => u.status === 'pending');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-[#0a0f0d] border border-[#006837]/30 shadow-2xl">
        <div className="bg-[#0f1a16] px-8 py-6 flex justify-between items-center border-b border-[#006837]/20">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1c40f]/20 text-[#f1c40f] border border-[#f1c40f]/20">
              <i className="fas fa-users-cog"></i>
            </div>
            <div>
              <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-white">Gestão de Acessos</h2>
              <p className="text-[9px] font-black text-[#006837] uppercase tracking-[0.3em]">Controle de Usuários</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-10">
              <i className="fas fa-check-circle text-4xl text-[#006837] mb-4 opacity-20"></i>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold">{user.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-tighter">Pendente</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateStatus(user.id, 'rejected')}
                      className="px-4 py-2 rounded-lg bg-red-600/10 text-red-500 text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all"
                    >
                      Recusar
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(user.id, 'approved')}
                      className="px-4 py-2 rounded-lg bg-[#006837] text-white text-[9px] font-black uppercase hover:bg-[#008a4a] transition-all shadow-lg shadow-[#006837]/20"
                    >
                      Autorizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
