import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  Download,
  Monitor,
  Clock,
  Cake,
  Calendar,
  Camera,
  Phone,
  ShieldCheck,
  Key
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from './Cards';
import { Employee } from '../types';
import { PointManagement } from './PointManagement';
import { UserManagement } from './UserManagement';
import { PermissionsManagement } from './PermissionsManagement';
import { hasPermission } from '../lib/permissions';
import { cn } from '../lib/utils';
import { ImageOptimizer, optimizeImageBeforeUpload } from './ImageOptimizer';

interface StaffManagementProps {
  employees: Employee[];
  onExportToExcel: () => void;
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string, name: string) => void;
  onUpdateEmployeePhoto?: (id: string, photoUrl: string) => Promise<void>;
  user: any;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  employees,
  onExportToExcel,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onUpdateEmployeePhoto,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'point' | 'users' | 'permissions'>('employees');

  const showPointTab = hasPermission(user?.role, 'point', user?.email, user?.permissions, user?.displayName);
  const showUsersTab = user?.role === 'Dono / Proprietário' || 
                       user?.role === 'Dono' || 
                       user?.role === 'Proprietário' || 
                       user?.role === 'Administrativo' ||
                       user?.email === 'elizeuferron@gmail.com';

  // Determine current tab safely based on visibility permissions
  const currentTab = 
    activeTab === 'point' && !showPointTab ? 'employees' : 
    activeTab === 'users' && !showUsersTab ? 'employees' : 
    activeTab;

  const downloadInstaller = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    const appUrl = window.location.origin;
    const batContent = `@echo off
set "URL=${appUrl}"
set "SHORTCUT_NAME=DM Turismo Pro"
set "SCRIPT=%TEMP%\\CreateShortcut.vbs"

echo Set oWS = CreateObject("WScript.Shell") > "%SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") & "\\%SHORTCUT_NAME%.lnk" >> "%SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT%"
echo oLink.TargetPath = "msedge.exe" >> "%SCRIPT%"
echo oLink.Arguments = "--app=%URL%" >> "%SCRIPT%"
echo oLink.Description = "Sistema de Gestão DM Turismo" >> "%SCRIPT%"
echo oLink.IconLocation = "msedge.exe,0" >> "%SCRIPT%"
echo oLink.Save >> "%SCRIPT%"

cscript /nologo "%SCRIPT%"
del "%SCRIPT%"

echo ==========================================
echo   DM TURISMO - INSTALADOR WINDOWS
echo ==========================================
echo.
echo   Atalho criado com sucesso na Area de Trabalho!
echo   Agora voce pode abrir o sistema como um Programa.
echo.
echo ==========================================
pause`;

    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Instalar_DM_Turismo.bat';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return 'Não inf.';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter font-display">Fichário Operacional</h1>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-zinc-500 font-medium tracking-tight flex items-center gap-2">
              <Users size={14} />
              {employees.length} Colaboradores Registrados
            </p>
            <button 
              onClick={onExportToExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-asphalt-900 text-zinc-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-asphalt-800 hover:text-white transition-all shadow-lg active:scale-95 border border-white/5"
            >
              <FileSpreadsheet size={12} />
              Excel
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right justify-between md:justify-end">
          {(showPointTab || showUsersTab) && (
            <div className="flex gap-2 p-1 bg-zinc-950/80 border border-white/5 rounded-2xl">
              <button
                onClick={() => setActiveTab('employees')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  currentTab === 'employees'
                    ? "bg-zinc-800 text-brand-accent shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Users size={12} />
                Funcionários
              </button>
              {showPointTab && (
                <button
                  onClick={() => setActiveTab('point')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    currentTab === 'point'
                      ? "bg-zinc-800 text-brand-accent shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Clock size={12} />
                  Cartão Ponto
                </button>
              )}
              {showUsersTab && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    currentTab === 'users'
                      ? "bg-zinc-800 text-brand-accent shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <ShieldCheck size={12} />
                  Acessos
                </button>
              )}
              {showUsersTab && (
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    currentTab === 'permissions'
                      ? "bg-zinc-800 text-brand-accent shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Key size={12} />
                  Permissões
                </button>
              )}
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Hoje é dia</p>
            <p className="text-2xl font-black text-brand-accent tracking-tighter uppercase font-display">
              {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
      
      {currentTab === 'employees' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button 
            onClick={onAddEmployee}
            className="h-full min-h-[220px] flex flex-col items-center justify-center gap-4 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-3xl hover:border-brand-accent/50 hover:bg-zinc-900/50 transition-all group"
          >
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-brand-accent group-hover:text-zinc-950 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">Admitir Funcionário</span>
          </button>

          {employees.map(e => (
            <Card 
              key={e.id} 
              onClick={() => onEditEmployee(e)}
              className="relative overflow-hidden group border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer p-0"
            >
              <div className="p-6 border-b border-zinc-800/50 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative group/avatar w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 overflow-hidden shrink-0">
                    {e.photoUrl ? (
                      <ImageOptimizer src={e.photoUrl} alt={e.name} className="w-full h-full object-cover" maxWidth={150} quality={0.7} />
                    ) : (
                      <Users size={24} />
                    )}
                    {onUpdateEmployeePhoto && (
                      <label 
                        onClick={(evt) => evt.stopPropagation()}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                        title="Upload Foto"
                      >
                        <Camera size={14} className="text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(evt) => {
                            evt.stopPropagation();
                            const file = evt.target.files?.[0];
                            if (file) {
                              optimizeImageBeforeUpload(file, 200, 0.75)
                                .then((compressedBase64) => {
                                  onUpdateEmployeePhoto(e.id, compressedBase64);
                                })
                                .catch((err) => {
                                  console.error('Failed to optimize avatar upload:', err);
                                  // Fallback to traditional reader on error
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    onUpdateEmployeePhoto(e.id, reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-white uppercase text-sm tracking-tight leading-none mb-1.5">{e.name}</h4>
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase tracking-widest">{e.role}</span>
                  </div>
                </div>
                <button 
                  onClick={(evt) => {
                    evt.stopPropagation();
                    onDeleteEmployee(e.id, e.name);
                  }}
                  className="p-2 text-zinc-600 hover:text-rose-500 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-6">
                 <div className="flex items-center gap-2">
                   <div className="flex-1 px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 font-mono">
                      {e.phone || 'N/A'} • 🎂 {formatBirthDate(e.birthDate)}
                   </div>
                   {e.name.toLowerCase().includes('elizeu ferron') && (
                      <button 
                        onClick={downloadInstaller}
                        className="px-3 py-2 bg-brand-accent text-zinc-950 rounded-lg flex items-center gap-2 text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-accent/20"
                        title="Baixar Executável Windows"
                      >
                        <Monitor size={12} />
                        Instalador
                      </button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : currentTab === 'point' ? (
        <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-6 backdrop-blur-md shadow-2xl animate-in fade-in duration-300">
          <PointManagement user={user} />
        </div>
      ) : currentTab === 'permissions' ? (
        <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-6 backdrop-blur-md shadow-2xl animate-in fade-in duration-300">
          <PermissionsManagement />
        </div>
      ) : (
        <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-6 backdrop-blur-md shadow-2xl animate-in fade-in duration-300">
          <UserManagement />
        </div>
      )}
    </div>
  );
};
