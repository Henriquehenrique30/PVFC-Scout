
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, users, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Login usando o formato Nome.Sobrenome
      const user = users.find(u => 
        (u.username?.toLowerCase() === username.toLowerCase() || u.email === username) && 
        u.password === password
      );

      if (user) {
        if (user.status === 'pending') {
          setError('Acesso pendente de aprovação pela diretoria.');
        } else {
          onLogin(user);
        }
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } else {
      // Validação de Registro
      if (password !== confirmPassword) {
        setError('As senhas não são idênticas.');
        return;
      }

      const generatedUsername = `${firstName.trim()}.${lastName.trim()}`;
      
      if (users.find(u => u.username?.toLowerCase() === generatedUsername.toLowerCase())) {
        setError('Este usuário já existe no sistema.');
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: generatedUsername,
        name: `${firstName.trim()} ${lastName.trim()}`,
        password,
        role: users.length === 0 ? 'admin' : 'scout',
        status: users.length === 0 ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      };

      onRegister(newUser);
      setIsLogin(true);
      alert(newUser.role === 'admin' 
        ? `Conta Administrador criada! Login: ${generatedUsername}` 
        : `Cadastro solicitado! Seu login será: ${generatedUsername}. Aguarde aprovação.`);
      
      // Limpa campos após registro
      setFirstName('');
      setLastName('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050807] overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#006837] rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f1c40f] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md p-6 md:p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center shrink-0 mb-4">
             <img 
              src="https://upload.wikimedia.org/wikipedia/pt/2/23/Logo_do_Porto_Vit%C3%B3ria_Futebol_Clube.png" 
              alt="Porto Vitória FC Logo" 
              className="h-full w-full object-contain filter drop-shadow-[0_0_15px_rgba(0,104,55,0.4)]"
             />
          </div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-tighter text-white">
            Porto Vitória <span className="text-[#f1c40f]">FC</span>
          </h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Plataforma de Mercado Pro</p>
        </div>

        <div className="bg-[#0a0f0d] rounded-[2rem] border border-[#006837]/30 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider font-oswald text-center">
            {isLogin ? 'Acesso Restrito' : 'Cadastro de Analista'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Usuário (Nome.Sobrenome)</label>
                  <input 
                    required type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/50 border border-slate-800 p-4 text-sm text-white focus:ring-1 focus:ring-[#f1c40f] outline-none transition-all"
                    placeholder="Ex: João.Silva"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Nome</label>
                    <input 
                      required type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="w-full rounded-xl bg-slate-900/50 border border-slate-800 p-4 text-sm text-white focus:ring-1 focus:ring-[#006837] outline-none transition-all"
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Sobrenome</label>
                    <input 
                      required type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      className="w-full rounded-xl bg-slate-900/50 border border-slate-800 p-4 text-sm text-white focus:ring-1 focus:ring-[#006837] outline-none transition-all"
                      placeholder="Sobrenome"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Senha</label>
              <input 
                required type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 p-4 text-sm text-white focus:ring-1 focus:ring-[#006837] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">Confirmar Senha</label>
                <input 
                  required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl bg-slate-900/50 border p-4 text-sm text-white focus:ring-1 outline-none transition-all ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500/50 ring-red-500' : 'border-slate-800 focus:ring-[#006837]'
                  }`}
                  placeholder="Repita a senha"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase text-center animate-pulse">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full rounded-xl bg-[#006837] py-4 text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-[#008a4a] transition-all shadow-lg shadow-[#006837]/20 mt-2"
            >
              {isLogin ? 'Entrar no Sistema' : 'Solicitar Cadastro'}
            </button>
          </form>

          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="w-full mt-6 text-[9px] font-bold text-slate-500 hover:text-[#f1c40f] uppercase tracking-widest transition-colors"
          >
            {isLogin ? 'Não tem conta? Solicite acesso' : 'Já tem cadastro? Faça login'}
          </button>
        </div>
        
        <p className="mt-8 text-center text-[9px] text-slate-700 uppercase tracking-widest font-medium">
          © {new Date().getFullYear()} Porto Vitória FC - Departamento de Mercado
        </p>
      </div>
    </div>
  );
};

export default Auth;
