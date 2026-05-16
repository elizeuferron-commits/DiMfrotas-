import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path: string) {
  const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';
  // Se estiver no Electron, aponta para a API hospedada em produção
  const baseUrl = isElectron 
    ? 'https://ais-dev-rj7kgm7su5tpr5yny5vp35-707517084471.us-east1.run.app' 
    : '';
  return `${baseUrl}${path}`;
}
