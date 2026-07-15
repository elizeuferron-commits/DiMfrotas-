import { UserRole } from '../types';

export let ROLE_PERMISSIONS: Record<string, string[]> = {
  'Dono / Proprietário': [
    'dashboard', 'trips', 'fleet', 'finance', 'fuel', 'inventory', 'gabinete'
  ],
  'Motorista': ['dashboard', 'trips', 'fuel'],
  'Limpeza / Conservação': ['dashboard', 'trips', 'fuel', 'inventory'],
  'Administrativo': [
    'dashboard', 'trips', 'finance', 'fuel', 'inventory', 'gabinete'
  ],
  'Gestor de Frotas': [
    'dashboard', 'trips', 'fleet', 'fuel', 'gabinete'
  ],
  'Coordenador Logístico': [
    'dashboard', 'trips', 'fleet', 'fuel', 'inventory', 'gabinete'
  ],
  'Visitante': ['dashboard', 'trips', 'fuel']
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
  const isOwner = role === 'Dono / Proprietário' || role === 'Dono' || role === 'Proprietário' || email === 'elizeuferron@gmail.com';

  // Always allow owners / elizeu for absolutely everything
  if (isOwner) return true;

  // Check strict 'criador' restriction: strictly Elizeu Ferron
  if (sectionId === 'criador') {
    return email === 'elizeuferron@gmail.com';
  }

  // Check strict 'point' (Cartão Ponto) restriction: only owners/proprietários or elizeuferron@gmail.com
  if (sectionId === 'point') {
    const isOwnerRole = role === 'Dono / Proprietário' || role === 'Dono' || role === 'Proprietário';
    const isElizeuEmail = email === 'elizeuferron@gmail.com';
    return isOwnerRole || isElizeuEmail;
  }

  if (!role) return false;
  
  // If user has custom permissions, they override role-based permissions
  if (userPermissions && userPermissions.length > 0) {
    return userPermissions.includes(sectionId);
  }

  if (role === 'admin') return true;
  const allowedSections = ROLE_PERMISSIONS[role];
  return allowedSections?.includes(sectionId) || false;
};
