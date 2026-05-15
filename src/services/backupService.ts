import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const COLLECTIONS_TO_BACKUP = [
  'users',
  'vehicles',
  'employees',
  'fuel_tanks',
  'fuel_logs',
  'fuel_entries',
  'maintenance_logs',
  'stock_items',
  'checklists',
  'financial_transactions',
  'trips'
];

export interface BackupRecord {
  id?: string;
  timestamp: Timestamp;
  createdBy: string;
  data: Record<string, any[]>;
  size: number;
}

export const backupService = {
  async performFullBackup(userEmail: string): Promise<string> {
    const backupData: Record<string, any[]> = {};
    let totalItems = 0;

    for (const colName of COLLECTIONS_TO_BACKUP) {
      try {
        const snap = await getDocs(collection(db, colName));
        backupData[colName] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        totalItems += snap.docs.length;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, colName);
      }
    }

    const backupRecord = {
      timestamp: serverTimestamp(),
      createdBy: userEmail,
      data: backupData,
      size: totalItems
    };

    try {
      const docRef = await addDoc(collection(db, 'backups'), backupRecord);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'backups');
      throw error; // reachable? handleFirestoreError throws
    }
  },

  async getLastBackup(): Promise<BackupRecord | null> {
    const path = 'backups';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as BackupRecord;
    } catch (error) {
      console.error('Erro ao buscar último backup:', error);
      handleFirestoreError(error, OperationType.LIST, path);
      return null;
    }
  },

  downloadAsJSON(data: any, fileName: string) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
