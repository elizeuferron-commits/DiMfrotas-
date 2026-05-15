import { UserRole } from '../types';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Dono / Proprietário': [
    'fleet', 'dashboard', 'finance', 'vencimentos', 'fuel', 
    'maintenance', 'staff', 'trips', 'os', 'inventory', 'reports',
    'journey', 'fretamento', 'ai-consultant'
  ],
  'Motorista': ['fuel', 'maintenance', 'os', 'dashboard', 'journey', 'ai-consultant'],
  'Limpeza / Conservação': ['inventory', 'fuel', 'os', 'dashboard', 'ai-consultant'],
  'Administrativo': [
    'finance', 'inventory', 'reports', 'trips', 'os', 'staff', 'vencimentos', 'dashboard',
    'fretamento', 'journey', 'ai-consultant'
  ],
  'Gestor de Frotas': [
    'fleet', 'maintenance', 'staff', 'fuel', 'reports', 'dashboard', 'journey', 'ai-consultant'
  ],
  'Coordenador Logístico': [
    'fleet', 'dashboard', 'vencimentos', 'fuel', 'maintenance', 'staff', 'trips', 'os', 'inventory', 'reports',
    'journey', 'fretamento', 'ai-consultant'
  ],
  'Visitante': ['dashboard', 'trips']
};

export const hasPermission = (
  role: string | undefined, 
  sectionId: string, 
  email?: string, 
  userPermissions?: string[]
): boolean => {
  if (email === 'elizeuferron@gmail.com') return true;
  if (!role) return false;
  
  // If user has custom permissions, they override role-based permissions
  if (userPermissions && userPermissions.length > 0) {
    return userPermissions.includes(sectionId);
  }

  if (role === 'admin') return true;
  const allowedSections = ROLE_PERMISSIONS[role];
  return allowedSections?.includes(sectionId) || false;
};
