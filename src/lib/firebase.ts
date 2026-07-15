import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose firebase warnings in sandbox / iframe environments
setLogLevel('error');

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling enabled for sandboxed environments and custom database support
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any, firebaseConfig.firestoreDatabaseId);

// Enable robust Multi-Tab Offline Persistence for real-time and offline employee operations
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firestore Persistence] Precondition failed (multiple tabs open).');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firestore Persistence] Unimplemented in current browser environment.');
    } else {
      console.error('[Firestore Persistence] Error:', err);
    }
  });
} catch (e) {
  console.warn('[Firestore Persistence] Enable multi-tab failed:', e);
}

export const auth = getAuth();
export const storage = getStorage(app);

let messagingInstance: any = null;
try {
  // Safe initialization of Firebase Messaging to prevent throwing "messaging/unsupported-browser"
  messagingInstance = getMessaging(app);
} catch (error) {
  console.warn('[FCM] Firebase Messaging is not supported in this browser environment:', error);
}
export const messaging = messagingInstance;

// Test connection on boot quietly - disabled to prevent throwing eager connectivity alerts in sandbox/offline environments.
/*
async function testConnection() {
  try {
    // Attempt to fetch a non-existent document from the server to verify connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    // Quietly log to avoid cluttering in offline/sandbox environments
    console.log("Firestore status: Offline local replica running (standard for preview/sandboxes)");
  }
}
testConnection();
*/

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

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        newObj[key] = cleanUndefined(val);
      }
    }
    return newObj;
  }
  return obj;
}
