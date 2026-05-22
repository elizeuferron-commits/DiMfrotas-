import { UserRole } from '../types';

export let ROLE_PERMISSIONS: Record<string, string[]> = {
  'Dono / Proprietário': [
    'fleet', 'dashboard', 'finance', 'vencimentos', 'fuel', 
    'maintenance', 'staff', 'trips', 'os', 'inventory', 'reports',
    'fretamento', 'criador', 'point'
  ],
  'Motorista': ['fuel', 'maintenance', 'os', 'dashboard', 'criador'],
  'Limpeza / Conservação': ['inventory', 'fuel', 'os', 'dashboard', 'criador'],
  'Administrativo': [
    'finance', 'inventory', 'reports', 'trips', 'os', 'staff', 'vencimentos', 'dashboard',
    'fretamento', 'criador'
  ],
  'Gestor de Frotas': [
    'fleet', 'maintenance', 'staff', 'fuel', 'reports', 'dashboard', 'criador'
  ],
  'Coordenador Logístico': [
    'fleet', 'dashboard', 'vencimentos', 'fuel', 'maintenance', 'staff', 'trips', 'os', 'inventory', 'reports',
    'fretamento', 'criador'
  ],
  'Visitante': ['dashboard', 'trips']
};

export const setRolePermissions = (newPermissions: Record<string, string[]>) => {
  ROLE_PERMISSIONS = newPermissions;
};

export const hasPermission = (
  role: string | undefined, 
  sectionId: string, 
  email?: string, 
  userPermissions?: string[],
  name?: string
): boolean => {
  // Check strict 'point' tool restriction first: only owners/proprietários or elizeuferron@gmail.com
  if (sectionId === 'point') {
    const isOwner = role === 'Dono / Proprietário' || role === 'Dono' || role === 'Proprietário';
    const isElizeuEmail = email === 'elizeuferron@gmail.com';
    
    return isElizeuEmail || isOwner;
  }

  // Always allow elizeu for everything else
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
