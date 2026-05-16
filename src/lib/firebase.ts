import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Optimized Firestore initialization with detailed logging
console.log("Initializing Firestore with Database ID:", firebaseConfig.firestoreDatabaseId);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: -1, 
}, firebaseConfig.firestoreDatabaseId);

// Persistence check
const enablePersistence = async () => {
  try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log("Firestore persistence enabled.");
  } catch (err: any) {
    console.warn('Firestore persistence status:', err.message);
  }
};
enablePersistence();

export const auth = getAuth();

// CRITICAL CONSTRAINT: Test connection on boot with retry
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful.");
      return;
    } catch (error: any) {
      console.warn(`Connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
          console.error("Firestore connection issue: Please check your internet or Firebase project configuration.");
        }
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
