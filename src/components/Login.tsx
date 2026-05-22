import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle, 
  ChevronRight, 
  Fingerprint,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface LoginProps {
  onSuccess?: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isEmailView, setIsEmailView] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success('Acesso autorizado. Bem-vindo ao DM Pro!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Login Error:', error);
      let message = 'Erro ao realizar login. Verifique suas credenciais.';
      if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success('Login realizado com sucesso via Google!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      toast.error('Falha na autenticação via Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Informe seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setShowReset(false);
    } catch (error) {
      toast.error('Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-[url('/background.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-brand-accent/20">
              <ShieldCheck className="w-10 h-10 text-brand-accent" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
              DM <span className="text-brand-accent">PRO</span> LOGIN
            </h1>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">
              Central de Acesso Corporativo
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isEmailView ? (
              <motion.div
                key="social-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-14 bg-white text-zinc-950 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  id="btn-google-login"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  )}
                  Acessar com Google
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">OU</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <button
                  onClick={() => setIsEmailView(true)}
                  className="w-full h-14 bg-zinc-800 text-white rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all border border-zinc-700 shadow-lg"
                  id="btn-email-mode"
                >
                  <Mail className="w-5 h-5 text-brand-accent" />
                  Acesso com E-mail e Senha
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="email-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailLogin}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-brand-accent transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-700 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all outline-none"
                      required
                      id="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Senha de Acesso</label>
                    <button 
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:underline"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-brand-accent transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-700 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all outline-none"
                      required
                      id="input-password"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEmailView(false)}
                    className="w-20 h-14 bg-zinc-800 text-white rounded-2xl font-black uppercase text-sm flex items-center justify-center hover:bg-zinc-700 transition-all border border-zinc-700"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-14 bg-brand-accent text-zinc-950 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 hover:bg-brand-accent/90 transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)] disabled:opacity-50"
                    id="btn-login-submit"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar no Sistema"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            </div>
            
            <div className="flex items-center gap-4 text-zinc-600">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                <Fingerprint className="w-3 h-3" /> Biometria
              </div>
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                <Smartphone className="w-3 h-3" /> PWA APK
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          © 2026 DM TURISMO • TODOS OS DIREITOS RESERVADOS
        </p>
      </motion.div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showReset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowReset(false)}
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-sm p-8 rounded-3xl relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-brand-accent" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Recuperar Senha</h3>
              <p className="text-zinc-500 text-xs font-medium mb-6 leading-relaxed">
                Informe o seu e-mail corporativo cadastrado por Elizeu Ferron para receber o link de redefinição.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Seu E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 text-white outline-none focus:border-brand-accent"
                    placeholder="email@dmturismo.com"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowReset(false)}
                    className="flex-1 h-12 bg-zinc-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="flex-[2] h-12 bg-brand-accent text-zinc-950 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-accent/90 transition-all shadow-lg"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enviar Instruções"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
