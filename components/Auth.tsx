
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, users, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        if (user.status === 'pending') {
          setError('Seu acesso está pendente de aprovação pela diretoria.');
        } else {
          onLogin(user);
        }
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } else {
      if (users.find(u => u.email === email)) {
        setError('Este e-mail já está cadastrado.');
        return;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role: users.length === 0 ? 'admin' : 'scout', // Primeiro é admin
        status: users.length === 0 ? 'approved' : 'pending', // Admin já nasce aprovado
        createdAt: new Date().toISOString()
      };
      
      onRegister(newUser);
      setIsLogin(true);
      alert(newUser.role === 'admin' ? 'Conta Administrador criada!' : 'Cadastro efetuado! Aguarde aprovação do administrador.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050807] overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#006837] rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f1c40f] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white p-2 shadow-2xl border-4 border-[#006837] mb-6">
             <i className="fas fa-ship text-[#006837] text-3xl"></i>
          </div>
          <h1 className="font-oswald text-3xl font-bold uppercase tracking-tighter text-white">
            Porto Vitória <span className="text-[#f1c40f]">FC</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Plataforma de Scouting Profissional</p>
        </div>

        <div className="bg-[#0a0f0d] rounded-[2rem] border border-[#006837]/30 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider font-oswald text-center">
            {isLogin ? 'Acesso Restrito' : 'Solicitar Acesso'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nome Completo</label>
                <input 
                  required type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#006837] outline-none"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">E-mail Profissional</label>
              <input 
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#006837] outline-none"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Senha</label>
              <input 
                required type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-white focus:ring-1 focus:ring-[#006837] outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full rounded-xl bg-[#006837] py-4 text-xs font-black text-white uppercase tracking-[0.2em] hover:bg-[#008a4a] transition-all shadow-lg shadow-[#006837]/20"
            >
              {isLogin ? 'Entrar no Sistema' : 'Enviar Solicitação'}
            </button>
          </form>

          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="w-full mt-6 text-[10px] font-bold text-slate-500 hover:text-[#f1c40f] uppercase tracking-widest transition-colors"
          >
            {isLogin ? 'Não tem conta? Solicite acesso' : 'Já tem cadastro? Faça login'}
          </button>
        </div>
        
        <p className="mt-8 text-center text-[9px] text-slate-700 uppercase tracking-widest">
          © {new Date().getFullYear()} Porto Vitória FC - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Auth;
