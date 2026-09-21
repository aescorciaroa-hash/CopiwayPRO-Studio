import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  image?: string;
  ingredients?: any[];
  packaging?: any[];
  category?: string;
  prepTime?: number;
  badge?: string;
  costPrice?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  totalCost?: number;
  unitCost?: number;
  unit?: string;
  category?: string;
  supplier?: string;
  notes?: string;
  createdAt?: string;
}
export interface InventoryLog {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  amount: number;
  type: 'Entrada' | 'Salida';
  reason: string;
  totalCost?: number;
  unitCost?: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  password?: string;
  location?: [number, number];
  currentOrderId?: string;
  currentOrderIds?: string[];
  destCoords?: [number, number] | null;
  plate?: string;
  vehicle?: string;
  baseCash?: number;
}

export interface Order {
  paymentMethod?: string;
  paymentStatus?: string;
  id: string;
  status: 'Pendiente' | 'En Preparación' | 'Listos' | 'En Camino' | 'Entregado' | 'Pagado' | 'entregado';
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  driverVehicle?: string;
  deliveryPin?: string;
  total: number;
  items: any[];
  address: string;
  date: string;
  rating?: number;
  reviewText?: string;
  clientPhone?: string;
  client?: string;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  pointsEarned?: number;
  time?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  price: number;
  category: string;
  stock?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  ordersCount?: number;
  totalSpent?: number;
  points?: number;
  lastOrderDate?: string;
  notifications?: Notification[];
  birthday?: string;
  cart?: any[];
  preferences?: {
    theme?: string;
    soundEnabled?: boolean;
  };
}

export interface StoreConfig {
  openTime: string;
  closeTime: string;
  isOpen?: boolean;
  isPaused?: boolean;
  shippingRate: number;
  profitMargin?: number;
  categories?: string[];
}

export const DEFAULT_MENU_CATEGORIES = [
  'Hamburguesas de Pan',
  'Hamburguesas de Patacón',
  'Perros Calientes',
  'Mazorcadas',
  'Salchipapas',
  'Chorizos',
  'Bebidas',
  'Adiciones / Extras'
];

interface AppState {
  products: Product[];
  inventory: InventoryItem[];
  staff: Staff[];
  orders: Order[];
  ingredients: Ingredient[];
  clients: Client[];
  storeConfig: StoreConfig;
  inventoryLogs: InventoryLog[];
  
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  setInventory: (inventory: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryStock: (id: string, amount: number) => Promise<void>;
  setInventoryLogs: (logs: InventoryLog[]) => void;
  addInventoryLog: (log: InventoryLog) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  
  setStaff: (staff: Staff[]) => void;
  addStaff: (employee: Staff) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  driverName?: string;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  
  setIngredients: (ingredients: Ingredient[]) => void;
  
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  setStoreConfig: (config: StoreConfig) => void;
  updateStoreConfig: (config: Partial<StoreConfig>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  removeCategory: (category: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  products: [],
  inventory: [],
  staff: [],
  orders: [],
  ingredients: [],
  clients: [],
  inventoryLogs: [],
  storeConfig: {
    openTime: '11:00',
    closeTime: '23:00',
    isOpen: true,
    shippingRate: 5000,
    profitMargin: 30,
    categories: DEFAULT_MENU_CATEGORIES
  },
  
  setProducts: (products) => set({ products }),
  addProduct: async (product) => {
    await setDoc(doc(db, 'products', product.id), product);
  },
  updateProduct: async (id, updates) => {
    await updateDoc(doc(db, 'products', id), updates);
  },
  deleteProduct: async (id) => {
    await deleteDoc(doc(db, 'products', id));
  },
  
  setInventory: (inventory) => set({ inventory }),
  addInventoryItem: async (item) => {
    await setDoc(doc(db, 'inventory', item.id), item);
    
    const logId = Date.now().toString();
    const log: InventoryLog = {
      id: logId,
      date: new Date().toISOString(),
      itemId: item.id,
      itemName: item.name,
      amount: item.stock,
      type: 'Entrada',
      reason: item.totalCost ? `Registro inicial (Costo Total: $${Number(item.totalCost).toLocaleString()})` : 'Registro inicial',
      totalCost: item.totalCost,
      unitCost: item.unitCost
    };
    try {
      await setDoc(doc(db, 'inventoryLogs', logId), log);
    } catch (e) {}
  },
  updateInventoryStock: async (id, amount) => {
    const item = get().inventory.find(i => i.id === id);
    if (item) {
      await updateDoc(doc(db, 'inventory', id), { stock: item.stock + amount });
      
      const logId = Date.now().toString();
      const log = {
        id: logId,
        date: new Date().toISOString(),
        itemId: id,
        itemName: item.name,
        amount: Math.abs(amount),
        type: amount > 0 ? 'Entrada' : 'Salida',
        reason: 'Ajuste manual'
      };
      // Try to save to DB, if fails just ignore for now
      try {
        await setDoc(doc(db, 'inventoryLogs', logId), log);
      } catch (e) {}
    }
  },
  deleteInventoryItem: async (id) => {
    await deleteDoc(doc(db, 'inventory', id));
  },
  setInventoryLogs: (logs) => set({ inventoryLogs: logs }),
  addInventoryLog: async (log) => {
    await setDoc(doc(db, 'inventoryLogs', log.id), log);
  },
  
  setStaff: (staff) => set({ staff }),
  addStaff: async (employee) => {
    await setDoc(doc(db, 'staff', employee.id), employee);
  },
  updateStaff: async (id, updates) => {
    await updateDoc(doc(db, 'staff', id), updates);
  },
  deleteStaff: async (id) => {
    await deleteDoc(doc(db, 'staff', id));
  },
  
  setOrders: (orders) => set({ orders }),
  addOrder: async (order) => {
    await setDoc(doc(db, 'orders', order.id), order);
    
    // Descontar inventario automáticamente
    const { inventory } = get();
    for (const item of order.items) {
      let allToDeduct: any[] = [];

      if (item.isCustom && (item.stack || item.extras)) {
        // En pedidos personalizados, descontamos cada insumo de la creación
        allToDeduct = item.stack || item.extras || [];
      } else {
        const baseIngredients = item.product?.ingredients || [];
        const packagingItems = item.product?.packaging || [];
        const removedNames = item.removed?.map((r: any) => (r.name || '').toLowerCase()) || [];
        const ingredientsToDeduct = baseIngredients.filter((ing: any) => !removedNames.includes((ing.name || '').toLowerCase()));
        const extraIngredients = item.extras || [];
        allToDeduct = [...ingredientsToDeduct, ...extraIngredients, ...packagingItems];
      }

      for (const ing of allToDeduct) {
        const ingName = (ing.name || '').toLowerCase().trim();
        const invItem = inventory.find((i: any) => 
          i.id === ing.id || 
          (i.name || '').toLowerCase().trim() === ingName ||
          (i.name || '').toLowerCase().includes(ingName) ||
          ingName.includes((i.name || '').toLowerCase())
        );
        if (invItem) {
          const baseDeduct = ing.quantityDeduct || 1;
          const deductionAmount = -1 * (item.quantity || 1) * baseDeduct;
          const newStock = Math.max(0, invItem.stock + deductionAmount);
          
          try {
            await updateDoc(doc(db, 'inventory', invItem.id), { stock: newStock });
            
            const logId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            const log = {
              id: logId,
              date: new Date().toISOString(),
              itemId: invItem.id,
              itemName: invItem.name,
              amount: Math.abs(deductionAmount),
              type: 'Salida',
              reason: `Venta - Pedido ${order.id} (${item.name || 'Personalizado'})`
            };
            await setDoc(doc(db, 'inventoryLogs', logId), log);
          } catch(e) {
            console.error("Error updating inventory:", e);
          }
        }
      }
    }
    
    // Descuento global por pedido (Bolsa de delivery)
    const bagItem = inventory.find((i: any) => (i.name || '').toLowerCase().includes('bolsa de empaque') || (i.name || '').toLowerCase().includes('bolsa delivery'));
    if (bagItem) {
      const newStock = Math.max(0, bagItem.stock - 1);
      try {
        await updateDoc(doc(db, 'inventory', bagItem.id), { stock: newStock });
        const logId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        await setDoc(doc(db, 'inventoryLogs', logId), {
          id: logId,
          date: new Date().toISOString(),
          itemId: bagItem.id,
          itemName: bagItem.name,
          amount: 1,
          type: 'Salida',
          reason: `Venta - Empaque Global Pedido ${order.id}`
        });
      } catch(e) { console.error(e); }
    }
  },
  updateOrderStatus: async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
  },
  updateOrder: async (id, updates) => {
    await updateDoc(doc(db, 'orders', id), updates);
  },
  deleteOrder: async (id) => {
    await deleteDoc(doc(db, 'orders', id));
  },
  
  setIngredients: (ingredients) => set({ ingredients }),
  
  setClients: (clients) => set({ clients }),
  addClient: async (client) => {
    await setDoc(doc(db, 'clients', client.id), client);
  },
  updateClient: async (id, updates) => {
    await updateDoc(doc(db, 'clients', id), updates);
  },
  deleteClient: async (id) => {
    await deleteDoc(doc(db, 'clients', id));
  },

  setStoreConfig: (config) => set({ storeConfig: config }),
  
  updateStoreConfig: async (config) => {
    await setDoc(doc(db, 'settings', 'config'), config, { merge: true });
  },

  addCategory: async (category: string) => {
    const clean = category.trim();
    if (!clean) return;
    const currentCategories = get().storeConfig.categories || DEFAULT_MENU_CATEGORIES;
    if (!currentCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      const newCategories = [...currentCategories, clean];
      await setDoc(doc(db, 'settings', 'config'), { categories: newCategories }, { merge: true });
      set(state => ({ storeConfig: { ...state.storeConfig, categories: newCategories } }));
    }
  },

  removeCategory: async (category: string) => {
    const currentCategories = get().storeConfig.categories || DEFAULT_MENU_CATEGORIES;
    const newCategories = currentCategories.filter(c => c !== category);
    await setDoc(doc(db, 'settings', 'config'), { categories: newCategories }, { merge: true });
    set(state => ({ storeConfig: { ...state.storeConfig, categories: newCategories } }));
  }
}));

