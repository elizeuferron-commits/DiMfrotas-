import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Lock
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  serverTimestamp 
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
    'Visitante'
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

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário do sistema? Ele perderá acesso imediato.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('Usuário removido com sucesso!');
    } catch (error) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-accent" />
            Gestão de Acessos
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
            Controle de permissões e credenciais DM Turismo
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="h-12 px-6 bg-brand-accent text-zinc-950 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-brand-accent/90 transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Novo Acesso
        </button>
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
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          disabled={user.role === 'Dono / Proprietário'}
                          className="p-2.5 bg-zinc-800/50 text-zinc-600 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Excluir Acesso"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
