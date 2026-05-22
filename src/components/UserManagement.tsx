import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Key, 
  Search, 
  Mail, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Save,
  X,
  Loader2,
  Lock,
  Share2,
  Download,
  Monitor,
  Smartphone as Phone,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { ConfirmModal } from './UI';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, userId: '', displayName: '' });

  // New user form state
  const [newUserData, setNewUserData] = useState({
    email: '',
    displayName: '',
    role: 'Motorista' as UserProfile['role']
  });

  const roles: UserProfile['role'][] = [
    'Dono / Proprietário',
    'Gestor de Frotas',
    'Coordenador Logístico',
    'Administrativo',
    'Motorista',
    'Limpeza / Conservação',
    'Visitante',
    'Aguardando Liberação'
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success('Permissão atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar permissão.');
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteDoc(doc(db, 'users', deleteConfirm.userId));
      toast.success('Usuário removido com sucesso!');
      setDeleteConfirm({ isOpen: false, userId: '', displayName: '' });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error('Erro ao remover usuário.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.email || !newUserData.displayName) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      // Create a temporary ID or use email as reference
      const tempId = newUserData.email.replace(/[.@]/g, '_');
      await setDoc(doc(db, 'users', tempId), {
        ...newUserData,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Usuário pré-cadastrado! Ele deve usar este e-mail no login.');
      setIsAdding(false);
      setNewUserData({ email: '', displayName: '', role: 'Motorista' });
    } catch (error) {
      toast.error('Erro ao cadastrar usuário.');
    }
  };

  const handleShareApp = () => {
    const appUrl = window.location.origin;
    const message = `Olá! Este é o link de acesso ao sistema DM Turismo Pro. \n\nPara instalar como Aplicativo no seu celular ou PC, abra o link e selecione "Instalar App" ou "Adicionar à Tela de Início": \n\n${appUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyShareLink = () => {
    const appUrl = window.location.origin;
    navigator.clipboard.writeText(appUrl);
    toast.success('Link de instalação copiado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-accent" />
            Gestão de Acessos
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
            Controle de permissões e credenciais DM Turismo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdding(true)}
            className="h-12 px-6 bg-brand-accent text-zinc-950 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Novo Acesso
          </button>
        </div>
      </div>

      {/* APP DISTRIBUTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 bg-gradient-to-br from-brand-accent/20 to-transparent rounded-[2.2rem]">
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] block mb-2">Instalador Inteligente</span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">DM Turismo Pro (Windows/Mobile)</h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                O sistema é otimizado para funcionar como um Aplicativo nativo sem precisar de lojas. 
                Compartilhe o link abaixo com sua equipe.
              </p>
            </div>
            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-brand-accent">
              <QrCode className="w-8 h-8" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={handleShareApp}
              className="flex-1 h-14 bg-[#25D366] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-green-500/10 active:scale-95"
            >
              <Share2 className="w-4 h-4" /> Enviar por WhatsApp
            </button>
            <button 
              onClick={copyShareLink}
              className="flex-1 h-14 bg-zinc-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" /> Copiar Link
            </button>
          </div>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 flex flex-col gap-4">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Download className="w-3 h-3 text-brand-accent" /> Guia de Instalação Rápida
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3 group hover:border-brand-accent/50 transition-colors">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase mb-1">Computador (Windows)</p>
                <p className="text-[10px] text-zinc-500 font-medium leading-normal">
                  Abra no Vivaldi/Edge e clique no ícone <span className="text-brand-accent font-black">(+)</span> na barra de endereços para instalar.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3 group hover:border-brand-accent/50 transition-colors">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase mb-1">Android (Celular)</p>
                <p className="text-[10px] text-zinc-500 font-medium leading-normal">
                  Abra no Chrome, clique nos <span className="text-brand-accent font-black">(3 pontos)</span> e escolha <span className="text-zinc-300 font-bold">"Instalar Aplicativo"</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics or Quick Filters */}
        <div className="lg:col-span-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl min-w-[160px] flex-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total de Usuários</p>
            <p className="text-2xl font-black text-white leading-none">{users.length}</p>
          </div>
          {roles.slice(0, 4).map(role => (
            <div key={role} className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl min-w-[160px] flex-1">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{role}</p>
              <p className="text-xl font-black text-zinc-400 leading-none">
                {users.filter(u => u.role === role).length}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="BUSCAR USUÁRIO OU E-MAIL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 text-[11px] font-black text-white uppercase tracking-widest outline-none focus:border-brand-accent transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50">
                    <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Colaborador</th>
                    <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nível de Acesso</th>
                    <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center">
                        <Loader2 className="w-8 h-8 text-brand-accent animate-spin mx-auto mb-3" />
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Carregando usuários...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-zinc-600 italic">
                        Nenhum usuário encontrado na busca.
                      </td>
                    </tr>
                  ) : filteredUsers.map(user => (
                    <motion.tr 
                      layout
                      key={user.uid} 
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-zinc-500 group-hover:bg-brand-accent group-hover:text-zinc-950 transition-colors">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              user.displayName?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase">{user.displayName || 'Sem Nome'}</p>
                            <p className="text-[9px] text-zinc-500 font-bold lowercase flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.uid, e.target.value as UserProfile['role'])}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-black text-zinc-300 uppercase tracking-widest focus:border-brand-accent transition-all outline-none cursor-pointer"
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setDeleteConfirm({ isOpen: true, userId: user.uid, displayName: user.displayName || 'Usuário' })}
                          className="p-2.5 bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded-xl transition-all"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-8 rounded-3xl shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <UserPlus className="w-8 h-8 text-brand-accent" />
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Cadastrar Colaborador</h3>
              <p className="text-zinc-500 text-xs font-medium mb-8 leading-relaxed">
                Adicione um novo usuário ao sistema. Ele deverá realizar o primeiro login usando este e-mail.
              </p>

              <form onSubmit={handleAddUser} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newUserData.displayName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, displayName: e.target.value.toUpperCase() }))}
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 text-white outline-none focus:border-brand-accent"
                    placeholder="NOME DO COLABORADOR"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 text-white outline-none focus:border-brand-accent"
                    placeholder="email@dmturismo.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Função / Cargo</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value as UserProfile['role'] }))}
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 text-[11px] font-black text-zinc-300 uppercase outline-none focus:border-brand-accent"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full h-14 bg-brand-accent text-zinc-950 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-brand-accent/90 transition-all shadow-lg flex items-center justify-center gap-3 mt-4"
                >
                  <Save className="w-5 h-5" />
                  Salvar Cadastro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={confirmDeleteUser}
        title="Remover Acesso"
        message={`Tem certeza que deseja remover o acesso de ${deleteConfirm.displayName}? Esta ação é definitiva.`}
      />
    </div>
  );
}
