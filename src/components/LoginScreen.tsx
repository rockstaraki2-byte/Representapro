import React, { useState } from 'react';
import { Usuario, EmpresaRepresentacao } from '../types';
import { Briefcase, Lock, Mail, ChevronRight, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  usuarios: Usuario[];
  empresas: EmpresaRepresentacao[];
  onLoginSuccess: (userId: string, empresaId: string) => void;
}

export default function LoginScreen({ usuarios, empresas, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showGoogleMock, setShowGoogleMock] = useState(false);
  const [googleSelectedUser, setGoogleSelectedUser] = useState<Usuario | null>(null);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(() => {
    return empresas[0]?.id || '';
  });

  // Auto-detect user type by email
  const matchedUser = usuarios.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  const isAdmin = matchedUser?.role === 'Administrador';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!matchedUser) {
      setError('Usuário não localizado no sistema.');
      return;
    }

    if (matchedUser.role === 'Administrador') {
      setError('Administradores devem acessar exclusivamente utilizando o botão "Entrar com o Google".');
      return;
    }

    if (matchedUser.empresaRepresentacaoId && matchedUser.empresaRepresentacaoId !== selectedEmpresaId) {
      setError('Este usuário não possui permissão para acessar esta Razão Social / Empresa.');
      return;
    }

    if (!matchedUser.ativo) {
      setError('Esta conta de usuário está inativa. Contate o administrador.');
      return;
    }

    if (matchedUser.senha !== password) {
      setError('Senha incorreta para esta conta.');
      return;
    }

    // Success!
    onLoginSuccess(matchedUser.id, selectedEmpresaId);
  };

  const handleGoogleLoginClick = () => {
    setError(null);
    // Find all admin users to show in mock popup
    const admins = usuarios.filter(u => u.role === 'Administrador' && u.ativo);
    
    // If the typed email matches an active admin, auto-select them in the mock
    const currentAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (currentAdmin) {
      setGoogleSelectedUser(currentAdmin);
    } else {
      setGoogleSelectedUser(admins[0] || null);
    }
    
    setShowGoogleMock(true);
  };

  const confirmGoogleMockLogin = (adminUser: Usuario) => {
    setShowGoogleMock(false);
    onLoginSuccess(adminUser.id, selectedEmpresaId);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/30 via-slate-950 to-slate-950 -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white"
        >
          <Briefcase className="w-6 h-6" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-serif font-extrabold text-2xl text-white tracking-tight">RepresentaPRO</h2>
          <p className="text-xs text-slate-400 mt-1">Plataforma de Gestão Comercial e Multiempresas</p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-950/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6"
        >
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="empresa" className="block text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider mb-1.5">
                Razão Social / Empresa para Acesso
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="h-4 w-4 text-slate-500" />
                </div>
                <select
                  id="empresa"
                  value={selectedEmpresaId}
                  onChange={(e) => {
                    setSelectedEmpresaId(e.target.value);
                    setError(null);
                  }}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer font-bold"
                >
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-950 text-white">
                      {emp.nomeFantasia}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="ex: andre@planalto.rep.br"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {email.trim() && (
                matchedUser ? (
                  isAdmin ? (
                    /* Google Login Button for Admins */
                    <motion.div
                      key="admin-google"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 pt-2"
                    >
                      <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-[11px] text-emerald-400">
                        <span className="font-bold">✓ Usuário Administrador detectado.</span>
                        <p className="text-slate-400 mt-0.5 leading-normal">
                          Como administrador, seu login deve ser feito de forma segura usando sua conta vinculada ao Google.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleGoogleLoginClick}
                        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Entrar com o Google</span>
                      </button>
                    </motion.div>
                  ) : (
                    /* Password Login for non-admins */
                    <motion.div
                      key="user-password"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label htmlFor="password" className="block text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                            Senha do Usuário
                          </label>
                          <span className="text-[9px] bg-blue-950 text-blue-400 border border-blue-900/50 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                            {matchedUser.role}
                          </span>
                        </div>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            id="password"
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePasswordSubmit}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shadow-emerald-950/20"
                      >
                        <span>Acessar o Sistema</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )
                ) : (
                  /* Standard display when e-mail is unrecognized (lets them try logging in anyway) */
                  <motion.div
                    key="unrecognized"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="password-generic" className="block text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider mb-1.5">
                        Senha de Acesso
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="password-generic"
                          type="password"
                          placeholder="••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handlePasswordSubmit}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Entrar com Senha</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleLoginClick}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                      >
                        <span>Acessar via Google</span>
                      </button>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mock Google OAuth Popup */}
      <AnimatePresence>
        {showGoogleMock && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 font-sans"
            >
              <div className="text-center space-y-2">
                {/* Google Logo */}
                <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.74 14.97.65 12 .65c-4.3 0-8 2.47-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
                  />
                  <path
                    fill="#4285F4"
                    d="M22.56 11.91c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22.65c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84c1.81 3.59 5.52 6.06 9.82 6.06z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 13.74c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.71H2.18C1.43 8.2 1 9.87 1 11.65s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                </svg>
                <h3 className="font-bold text-base text-slate-900 leading-tight">Fazer login com o Google</h3>
                <p className="text-[11px] text-slate-500">Escolha uma conta para prosseguir para o <strong>RepresentaPRO</strong></p>
              </div>

              <div className="mt-6 space-y-2.5 max-h-[220px] overflow-y-auto">
                {usuarios
                  .filter(u => u.role === 'Administrador' && u.ativo)
                  .map(admin => {
                    const empName = empresas.find(e => e.id === admin.empresaRepresentacaoId)?.nomeFantasia || 'N/A';
                    return (
                      <button
                        key={admin.id}
                        onClick={() => confirmGoogleMockLogin(admin)}
                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-3 transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                          {admin.nome[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-800 leading-tight truncate">{admin.nome}</p>
                          <p className="text-[10px] text-slate-400 font-mono leading-none truncate mt-0.5">{admin.email}</p>
                          <span className="inline-block mt-1 text-[8px] uppercase tracking-wider text-emerald-700 font-mono font-bold bg-emerald-150 px-1.5 py-0.5 rounded">
                            🏢 {empName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowGoogleMock(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
