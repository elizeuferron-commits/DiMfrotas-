import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, getDocs, setDoc, getDoc } from 'firebase/firestore';

const DB_NAME = 'dm_turismo_collections_cache_db';
const DB_VERSION = 4;
const STORES = {
  vehicles: 'vehicles_cache',
  employees: 'employees_cache',
  trips: 'trips_cache',
  generic: 'generic_collections_cache'
};

export class DBCacheService {
  private static instance: DBCacheService;
  private db: IDBDatabase | null = null;

  // In-memory cache for fast SWR delivery (0ms retrieval)
  private cachedVehiclesInMemory: any[] | null = null;
  private cachedEmployeesInMemory: any[] | null = null;
  private cachedTripsInMemory: any[] | null = null;
  private cachedGenericInMemory: Record<string, any[]> = {};

  // Event listener registries for SWR subscriptions
  private vehiclesListeners: ((vehicles: any[]) => void)[] = [];
  private employeesListeners: ((employees: any[]) => void)[] = [];
  private tripsListeners: ((trips: any[]) => void)[] = [];
  private genericListeners: Record<string, ((data: any[]) => void)[]> = {};

  // Active firestore subscription unsubscribers
  private vehiclesUnsubscribe: (() => void) | null = null;
  private employeesUnsubscribe: (() => void) | null = null;
  private tripsUnsubscribe: (() => void) | null = null;
  private genericUnsubscribes: Record<string, (() => void) | null> = {};

  private constructor() {}

  public static getInstance(): DBCacheService {
    if (!DBCacheService.instance) {
      DBCacheService.instance = new DBCacheService();
    }
    return DBCacheService.instance;
  }

  private initDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORES.vehicles)) {
          database.createObjectStore(STORES.vehicles);
        }
        if (!database.objectStoreNames.contains(STORES.employees)) {
          database.createObjectStore(STORES.employees);
        }
        if (!database.objectStoreNames.contains(STORES.trips)) {
          database.createObjectStore(STORES.trips);
        }
        if (!database.objectStoreNames.contains(STORES.generic)) {
          database.createObjectStore(STORES.generic);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB de cache local:', request.error);
        reject(request.error);
      };
    });
  }

  // --- VEHICLES CACHE (SWR DESIGN) ---

  public async getVehiclesFromCacheOnly(): Promise<any[]> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = database.transaction([STORES.vehicles], 'readonly');
        const store = transaction.objectStore(STORES.vehicles);
        const request = store.get('list');

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve([]);
            return;
          }

          if (Array.isArray(result)) {
            resolve(result);
            return;
          }

          const { data, timestamp } = result;
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (timestamp && (Date.now() - timestamp > sevenDaysMs)) {
            console.log('[Cache TTL] Cache de veículos expirou (mais de 7 dias). Limpando...');
            this.clearStore(STORES.vehicles).catch(err => console.error(err));
            resolve([]);
          } else {
            resolve(data || []);
          }
        };

        request.onerror = () => {
          console.error('Erro ao ler veículos do cache IndexedDB:', request.error);
          resolve([]);
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public async getVehicles(): Promise<any[]> {
    // Background revalidation
    this.revalidateVehiclesInBackground().catch(err => console.error('[SWR] Vehicles background revalidation error:', err));

    // Instant return of in-memory cache if available
    if (this.cachedVehiclesInMemory && this.cachedVehiclesInMemory.length > 0) {
      return this.cachedVehiclesInMemory;
    }

    // Instant return of IndexedDB cache
    const cached = await this.getVehiclesFromCacheOnly();
    if (cached && cached.length > 0) {
      this.cachedVehiclesInMemory = cached;
    }
    return cached;
  }

  public async saveVehicles(vehicles: any[]): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.vehicles], 'readwrite');
        const store = transaction.objectStore(STORES.vehicles);
        const request = store.put({
          data: vehicles,
          timestamp: Date.now()
        }, 'list');

        request.onsuccess = () => {
          this.cachedVehiclesInMemory = vehicles;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Erro ao salvar veículos no cache IndexedDB:', e);
    }
  }

  private async revalidateVehiclesInBackground() {
    try {
      const q = collection(db, 'vehicles');
      const querySnapshot = await getDocs(q);
      const vehiclesList = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));

      const current = this.cachedVehiclesInMemory || await this.getVehiclesFromCacheOnly();
      if (!isListEqual(current, vehiclesList)) {
        console.log('[SWR] Mudanças reais detectadas em veículos no Firestore em segundo plano. Sincronizando...');
        this.cachedVehiclesInMemory = vehiclesList;
        await this.saveVehicles(vehiclesList);
        this.notifyVehiclesSubscribers(vehiclesList);
      }
    } catch (err) {
      console.warn('[SWR] Falha ao revalidar veículos em segundo plano:', err);
    }
  }

  public subscribeVehicles(onUpdate: (vehicles: any[]) => void): () => void {
    this.vehiclesListeners.push(onUpdate);

    // Yield stale data instantly from memory or IndexedDB
    if (this.cachedVehiclesInMemory) {
      onUpdate(this.cachedVehiclesInMemory);
    } else {
      this.getVehiclesFromCacheOnly().then((vehicles) => {
        if (vehicles && vehicles.length > 0 && !this.cachedVehiclesInMemory) {
          this.cachedVehiclesInMemory = vehicles;
          onUpdate(vehicles);
        }
      });
    }

    // Initialize real-time SWR listener on first subscriber
    if (this.vehiclesListeners.length === 1) {
      this.startVehiclesListener();
    }

    return () => {
      this.vehiclesListeners = this.vehiclesListeners.filter((listener) => listener !== onUpdate);
      if (this.vehiclesListeners.length === 0 && this.vehiclesUnsubscribe) {
        this.vehiclesUnsubscribe();
        this.vehiclesUnsubscribe = null;
      }
    };
  }

  private startVehiclesListener() {
    try {
      const q = collection(db, 'vehicles');
      this.vehiclesUnsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('[SWR] Atualizações em tempo real detectadas para veículos no Firestore.');
        this.cachedVehiclesInMemory = list;
        this.saveVehicles(list).catch(err => console.error(err));
        this.notifyVehiclesSubscribers(list);
      }, (error) => {
        console.error('[SWR] Erro na escuta em tempo real de veículos:', error);
      });
    } catch (err) {
      console.error('[SWR] Erro ao iniciar escuta de veículos:', err);
    }
  }

  private notifyVehiclesSubscribers(vehicles: any[]) {
    this.vehiclesListeners.forEach((listener) => {
      try {
        listener(vehicles);
      } catch (err) {
        console.error('[SWR] Erro ao notificar assinante de veículos:', err);
      }
    });
  }

  // --- EMPLOYEES CACHE (SWR DESIGN) ---

  public async getEmployeesFromCacheOnly(): Promise<any[]> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = database.transaction([STORES.employees], 'readonly');
        const store = transaction.objectStore(STORES.employees);
        const request = store.get('list');

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve([]);
            return;
          }

          if (Array.isArray(result)) {
            resolve(result);
            return;
          }

          const { data, timestamp } = result;
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (timestamp && (Date.now() - timestamp > sevenDaysMs)) {
            console.log('[Cache TTL] Cache de funcionários expirou (mais de 7 dias). Limpando...');
            this.clearStore(STORES.employees).catch(err => console.error(err));
            resolve([]);
          } else {
            resolve(data || []);
          }
        };

        request.onerror = () => {
          console.error('Erro ao ler funcionários do cache IndexedDB:', request.error);
          resolve([]);
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public async getEmployees(): Promise<any[]> {
    // Background revalidation
    this.revalidateEmployeesInBackground().catch(err => console.error('[SWR] Employees background revalidation error:', err));

    // Instant return of in-memory cache if available
    if (this.cachedEmployeesInMemory && this.cachedEmployeesInMemory.length > 0) {
      return this.cachedEmployeesInMemory;
    }

    // Instant return of IndexedDB cache
    const cached = await this.getEmployeesFromCacheOnly();
    if (cached && cached.length > 0) {
      this.cachedEmployeesInMemory = cached;
    }
    return cached;
  }

  public async saveEmployees(employees: any[]): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.employees], 'readwrite');
        const store = transaction.objectStore(STORES.employees);
        const request = store.put({
          data: employees,
          timestamp: Date.now()
        }, 'list');

        request.onsuccess = () => {
          this.cachedEmployeesInMemory = employees;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Erro ao salvar funcionários no cache IndexedDB:', e);
    }
  }

  private async revalidateEmployeesInBackground() {
    try {
      const q = collection(db, 'employees');
      const querySnapshot = await getDocs(q);
      const employeesList = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));

      const current = this.cachedEmployeesInMemory || await this.getEmployeesFromCacheOnly();
      if (!isListEqual(current, employeesList)) {
        console.log('[SWR] Mudanças reais detectadas em funcionários no Firestore em segundo plano. Sincronizando...');
        this.cachedEmployeesInMemory = employeesList;
        await this.saveEmployees(employeesList);
        this.notifyEmployeesSubscribers(employeesList);
      }
    } catch (err) {
      console.warn('[SWR] Falha ao revalidar funcionários em segundo plano:', err);
    }
  }

  public subscribeEmployees(onUpdate: (employees: any[]) => void): () => void {
    this.employeesListeners.push(onUpdate);

    // Yield stale data instantly from memory or IndexedDB
    if (this.cachedEmployeesInMemory) {
      onUpdate(this.cachedEmployeesInMemory);
    } else {
      this.getEmployeesFromCacheOnly().then((employees) => {
        if (employees && employees.length > 0 && !this.cachedEmployeesInMemory) {
          this.cachedEmployeesInMemory = employees;
          onUpdate(employees);
        }
      });
    }

    // Initialize real-time SWR listener on first subscriber
    if (this.employeesListeners.length === 1) {
      this.startEmployeesListener();
    }

    return () => {
      this.employeesListeners = this.employeesListeners.filter((listener) => listener !== onUpdate);
      if (this.employeesListeners.length === 0 && this.employeesUnsubscribe) {
        this.employeesUnsubscribe();
        this.employeesUnsubscribe = null;
      }
    };
  }

  private startEmployeesListener() {
    try {
      const q = collection(db, 'employees');
      this.employeesUnsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('[SWR] Atualizações em tempo real detectadas para funcionários no Firestore.');
        this.cachedEmployeesInMemory = list;
        this.saveEmployees(list).catch(err => console.error(err));
        this.notifyEmployeesSubscribers(list);
      }, (error) => {
        console.error('[SWR] Erro na escuta em tempo real de funcionários:', error);
      });
    } catch (err) {
      console.error('[SWR] Erro ao iniciar escuta de funcionários:', err);
    }
  }

  private notifyEmployeesSubscribers(employees: any[]) {
    this.employeesListeners.forEach((listener) => {
      try {
        listener(employees);
      } catch (err) {
        console.error('[SWR] Erro ao notificar assinante de funcionários:', err);
      }
    });
  }

  public async clearStore(storeName: string): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete('list');

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Erro ao limpar loja de cache ${storeName}:`, e);
    }
  }

  // --- TRIPS CACHE AND INTELLIGENT INVALIDATION ---

  public async getTripsFromCacheOnly(): Promise<any[]> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = database.transaction([STORES.trips], 'readonly');
        const store = transaction.objectStore(STORES.trips);
        const request = store.get('list');

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve([]);
            return;
          }

          if (Array.isArray(result)) {
            resolve(result);
            return;
          }

          const { data } = result;
          resolve(data || []);
        };

        request.onerror = () => {
          console.error('Erro ao ler viagens do cache IndexedDB:', request.error);
          resolve([]);
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public async getTrips(): Promise<any[]> {
    // Background SWR revalidation
    this.revalidateTripsInBackground().catch(err => console.error('[SWR] Trips background revalidation error:', err));

    if (this.cachedTripsInMemory && this.cachedTripsInMemory.length > 0) {
      return this.cachedTripsInMemory;
    }
    const cached = await this.getTripsFromCacheOnly();
    if (cached && cached.length > 0) {
      this.cachedTripsInMemory = cached;
    }
    return cached;
  }

  public async saveTrips(trips: any[]): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([STORES.trips], 'readwrite');
        const store = transaction.objectStore(STORES.trips);
        const request = store.put({
          data: trips,
          timestamp: Date.now()
        }, 'list');

        request.onsuccess = () => {
          this.cachedTripsInMemory = trips;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Erro ao salvar viagens no cache IndexedDB:', e);
    }
  }

  public async saveTripsAndNotify(trips: any[]): Promise<void> {
    this.cachedTripsInMemory = trips;
    await this.saveTrips(trips);
    this.notifyTripsSubscribers(trips);
  }

  public async getTripsMetadata(): Promise<{ lastChangedAt: string } | null> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = database.transaction([STORES.trips], 'readonly');
        const store = transaction.objectStore(STORES.trips);
        const request = store.get('metadata');

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  public async saveTripsMetadata(metadata: { lastChangedAt: string }): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction([STORES.trips], 'readwrite');
        const store = transaction.objectStore(STORES.trips);
        const request = store.put(metadata, 'metadata');

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Erro ao salvar metadados de viagens no cache IndexedDB:', e);
    }
  }

  public subscribeTrips(onUpdate: (trips: any[]) => void): () => void {
    this.tripsListeners.push(onUpdate);

    if (this.cachedTripsInMemory) {
      onUpdate(this.cachedTripsInMemory);
    } else {
      this.getTripsFromCacheOnly().then((trips) => {
        if (trips && trips.length > 0 && !this.cachedTripsInMemory) {
          this.cachedTripsInMemory = trips;
          onUpdate(trips);
        }
      });
    }

    if (this.tripsListeners.length === 1) {
      this.startTripsMetadataListener();
    }

    return () => {
      this.tripsListeners = this.tripsListeners.filter((listener) => listener !== onUpdate);
      if (this.tripsListeners.length === 0 && this.tripsUnsubscribe) {
        this.tripsUnsubscribe();
        this.tripsUnsubscribe = null;
      }
    };
  }

  private async startTripsMetadataListener() {
    try {
      const metaRef = doc(db, 'settings', 'trips_metadata');
      
      this.tripsUnsubscribe = onSnapshot(metaRef, async (snapshot) => {
        let serverLastChangedAt = '';
        if (snapshot.exists()) {
          serverLastChangedAt = snapshot.data().lastChangedAt || '';
        }

        const localMeta = await this.getTripsMetadata();
        const localLastChangedAt = localMeta ? localMeta.lastChangedAt : '';

        if (!serverLastChangedAt || serverLastChangedAt !== localLastChangedAt || !this.cachedTripsInMemory || this.cachedTripsInMemory.length === 0) {
          console.log('[Cache trips] Invalidação inteligente! Mudança real detetada no Firestore. Carregando dados atualizados...');
          await this.refreshTripsFromServer(serverLastChangedAt);
        } else {
          console.log('[Cache trips] Cache validado! Nenhum tráfego de rede gerado para a coleção trips.');
        }
      }, async (error) => {
        console.warn('[Cache trips] Erro ao escutar metadados de trips. Tentando carregar local e assinar coleção:', error);
        if (!this.tripsUnsubscribe) {
          const q = collection(db, 'trips');
          const unsubFull = onSnapshot(q, (fullSnap) => {
            const list = fullSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const current = this.cachedTripsInMemory || [];
            if (!isListEqual(current, list) || !this.cachedTripsInMemory) {
              console.log('[Cache trips Fallback] Mudanças críticas detectadas na coleção total. Atualizando IndexedDB.');
              this.cachedTripsInMemory = list;
              this.saveTrips(list).catch(err => console.error(err));
              this.notifyTripsSubscribers(list);
            } else {
              console.log('[Cache trips Fallback] Sem mudanças críticas. Ignorando updates de UI.');
            }
          });
          this.tripsUnsubscribe = unsubFull;
        }
      });
    } catch (err) {
      console.error('[Cache trips] Erro ao iniciar listener de metadados:', err);
    }
  }

  private async revalidateTripsInBackground() {
    try {
      const metaRef = doc(db, 'settings', 'trips_metadata');
      const snapshot = await getDoc(metaRef);
      
      let serverLastChangedAt = '';
      if (snapshot.exists()) {
        serverLastChangedAt = snapshot.data().lastChangedAt || '';
      }

      const localMeta = await this.getTripsMetadata();
      const localLastChangedAt = localMeta ? localMeta.lastChangedAt : '';

      if (!serverLastChangedAt || serverLastChangedAt !== localLastChangedAt || !this.cachedTripsInMemory || this.cachedTripsInMemory.length === 0) {
        console.log('[SWR] Background revalidation: Trips lastChangedAt updated or cache empty.');
        await this.refreshTripsFromServer(serverLastChangedAt);
      }
    } catch (err) {
      console.warn('[SWR] Trips background revalidation failed:', err);
    }
  }

  public async refreshTripsFromServer(serverLastChangedAt?: string) {
    try {
      const q = collection(db, 'trips');
      const querySnapshot = await getDocs(q);
      const tripsList = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));

      let currentTrips = this.cachedTripsInMemory;
      if (!currentTrips) {
        currentTrips = await this.getTripsFromCacheOnly();
      }

      const isEqual = isListEqual(currentTrips || [], tripsList);

      if (!isEqual || !this.cachedTripsInMemory) {
        console.log('[Cache trips] Mudanças críticas detectadas nas viagens. Atualizando IndexedDB e notificando assinantes.');
        this.cachedTripsInMemory = tripsList;
        await this.saveTrips(tripsList);
        this.notifyTripsSubscribers(tripsList);
      } else {
        console.log('[Cache trips] Cache validado: alterações triviais ou inexistentes. Ignorando IndexedDB/UI updates.');
      }
      
      let timestampToSave = serverLastChangedAt;
      if (!timestampToSave) {
        timestampToSave = new Date().toISOString();
        await this.touchTripsMetadata(timestampToSave);
      }

      await this.saveTripsMetadata({ lastChangedAt: timestampToSave });
    } catch (error) {
      console.error('[Cache trips] Erro ao buscar viagens do Firestore:', error);
    }
  }

  private notifyTripsSubscribers(trips: any[]) {
    this.tripsListeners.forEach((listener) => {
      try {
        listener(trips);
      } catch (err) {
        console.error('[Cache trips] Erro ao notificar assinante:', err);
      }
    });
  }

  public async touchTripsMetadata(forcedTimestamp?: string): Promise<void> {
    try {
      const metaRef = doc(db, 'settings', 'trips_metadata');
      await setDoc(metaRef, {
        lastChangedAt: forcedTimestamp || new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[Cache Metadata] Erro ao atualizar metadados de trips:', err);
    }
  }

  // --- GENERIC COLLECTION CACHE (For scalable offline performance) ---

  public async getCollectionFromCache(storeName: string): Promise<any[]> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve) => {
        const transaction = database.transaction([STORES.generic], 'readonly');
        const store = transaction.objectStore(STORES.generic);
        const request = store.get(storeName);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve([]);
            return;
          }
          const { data, timestamp } = result;
          // Clean cached items older than 30 days
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          if (timestamp && (Date.now() - timestamp > thirtyDaysMs)) {
            console.log(`[Cache TTL] Cache da coleção ${storeName} expirou. Limpando...`);
            this.clearGenericCache(storeName).catch(err => console.error(err));
            resolve([]);
          } else {
            resolve(data || []);
          }
        };

        request.onerror = () => {
          console.error(`Erro ao ler ${storeName} do cache IndexedDB:`, request.error);
          resolve([]);
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public async saveCollectionToCache(storeName: string, data: any[]): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.generic], 'readwrite');
        const store = transaction.objectStore(STORES.generic);
        const request = store.put({
          data,
          timestamp: Date.now()
        }, storeName);

        request.onsuccess = () => {
          this.cachedGenericInMemory[storeName] = data;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Erro ao salvar ${storeName} no cache IndexedDB:`, e);
    }
  }

  private async clearGenericCache(storeName: string): Promise<void> {
    try {
      const database = await this.initDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.generic], 'readwrite');
        const store = transaction.objectStore(STORES.generic);
        const request = store.delete(storeName);
        request.onsuccess = () => {
          delete this.cachedGenericInMemory[storeName];
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Erro ao limpar ${storeName} do cache IndexedDB:`, e);
    }
  }
}

// Deep Comparison Helpers

export function isListEqual(list1: any[], list2: any[]): boolean {
  if (!list1 || !list2) return false;
  if (list1.length !== list2.length) return false;
  
  const map1 = new Map(list1.map(item => [item.id, item]));
  
  for (const item2 of list2) {
    const item1 = map1.get(item2.id);
    if (!item1) return false;
    
    if (!isDeepEqual(item1, item2)) return false;
  }
  
  return true;
}

function isDeepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    const isObjects = typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null;
    if (isObjects) {
      if (!isDeepEqual(val1, val2)) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }
  return true;
}

// Backward Compatibility Helpers

export function areTripsCriticallyEqual(t1: any, t2: any): boolean {
  return isDeepEqual(t1, t2);
}

export function areTripListsCriticallyEqual(list1: any[], list2: any[]): boolean {
  return isListEqual(list1, list2);
}

export const dbCacheService = DBCacheService.getInstance();

