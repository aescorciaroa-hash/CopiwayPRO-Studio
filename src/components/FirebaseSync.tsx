import { useEffect } from 'react';
import { collection, onSnapshot, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore, Product, InventoryItem, Staff, Order, Ingredient, DEFAULT_MENU_CATEGORIES } from '../store/useStore';

const INITIAL_PRODUCTS = [
  { id: '1', name: 'Hamburguesa Clásica Copiway', description: 'Pan, Carne 120g, Queso, Lechuga, Tomate, Salsas', price: 14000, active: true, category: 'Hamburguesas de Pan', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', ingredients: [{id: 'v1', name: 'Lechuga'}, {id: 'v2', name: 'Tomate'}, {id: 'v3', name: 'Cebolla'}] },
  { id: '2', name: 'Hamburguesa Tocineta', description: 'Pan, Carne 120g, Queso, Tocineta, Salsas', price: 17000, active: true, category: 'Hamburguesas de Pan', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800', ingredients: [{id: 'e1', name: 'Tocineta'}, {id: 'e2', name: 'Queso Cheddar'}] },
  { id: '3', name: 'Perro Caliente Sencillo', description: 'Pan, Salchicha, Queso, Cebolla, Salsas', price: 10000, active: true, category: 'Perros Calientes', image: 'https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&q=80&w=800', ingredients: [{id: 'v3', name: 'Cebolla'}, {id: 'v1', name: 'Lechuga'}] },
  { id: '4', name: 'Hamburguesa Doble Carne', description: 'Pan, 2 Carnes 120g, Doble Queso, Tocineta', price: 22000, active: true, category: 'Hamburguesas de Pan', image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800', ingredients: [{id: 'e3', name: 'Carne 120g'}, {id: 'e2', name: 'Queso Cheddar'}, {id: 'e1', name: 'Tocineta'}] },
  { id: '5', name: 'Perro Caliente Suizo', description: 'Pan, Salchicha, Queso Suizo, Cebolla Caramelizada', price: 13000, active: true, category: 'Perros Calientes', image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&q=80&w=800', ingredients: [{id: 'v3', name: 'Cebolla'}, {id: 'e2', name: 'Queso Cheddar'}] },
  { id: '6', name: 'Papas Fritas', description: 'Porción de papas a la francesa crujientes', price: 6000, active: true, category: 'Salchipapas', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=800', ingredients: [] }
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Pan de Hamburguesa', stock: 100, unitCost: 1500, category: 'Panadería', unit: 'Unidades' },
  { id: '2', name: 'Pan de Perro', stock: 100, unitCost: 1200, category: 'Panadería', unit: 'Unidades' },
  { id: '3', name: 'Carne 120g', stock: 10, unitCost: 4000, category: 'Carnes', unit: 'Unidades' },
  { id: '4', name: 'Salchicha', stock: 50, unitCost: 2500, category: 'Embutidos', unit: 'Unidades' },
  { id: '5', name: 'Tocineta', stock: 50, unitCost: 4000, category: 'Carnes', unit: 'Porciones' },
  { id: '6', name: 'Queso Cheddar', stock: 0, unitCost: 3000, category: 'Lácteos', unit: 'Láminas' }, // Agotado
  { id: '7', name: 'Lechuga', stock: 200, unitCost: 1000, category: 'Verduras', unit: 'Porciones' },
  { id: '8', name: 'Tomate', stock: 200, unitCost: 1000, category: 'Verduras', unit: 'Rodajas' },
  { id: '9', name: 'Cebolla', stock: 200, unitCost: 1000, category: 'Verduras', unit: 'Porciones' },
  { id: '10', name: 'Papas a la Francesa', stock: 45, unitCost: 2000, category: 'Acompañamientos', unit: 'Porciones' }
];

const INITIAL_STAFF = [
  { id: '1', name: 'Carlos Mendoza', email: 'carlos.mendoza@copiway.com', role: 'Ayudante de cocina', active: true },
  { id: '2', name: 'Valentina Rojas', email: 'valentina.rojas@copiway.com', role: 'Domiciliario', active: true }
];

const INITIAL_ORDERS = [
  { id: '#ORD-1002', status: 'Pagado', client: 'Juan Pérez', total: 35000, subtotal: 30000, shipping: 5000, items: [{ name: 'Hamburguesa Clásica', quantity: 2, price: 12000, modifications: ['SIN Cebolla'] }, { name: 'Papas Fritas', quantity: 1, price: 6000 }], address: 'Cra 51B # 82-254, Apto 301', date: new Date().toISOString() },
  { id: '#ORD-1003', status: 'En Camino', client: 'María Gómez', total: 42000, subtotal: 37000, shipping: 5000, items: [{ name: 'Perro Caliente', quantity: 1, price: 37000, modifications: ['EXTRA Queso', 'SIN Salsas'] }], address: 'Calle 84 # 46-20, Local 2', date: new Date().toISOString() },
  { id: '#ORD-1004', status: 'Entregado', client: 'Andrés Escorcia', total: 25000, subtotal: 20000, shipping: 5000, items: [{ id: 'item1', name: 'Hamburguesa Clásica Copiway', quantity: 1, finalPrice: 14000, isCustom: false, extras: [] }, { id: 'item2', name: 'Papas Fritas', quantity: 1, finalPrice: 6000, isCustom: false, extras: [] }], address: 'Calle 10 # 5-20, Centro', date: new Date(Date.now() - 86400000).toISOString(), rating: 5, pointsEarned: 25 },
  { id: '#ORD-1005', status: 'En Preparación', client: 'Andrés Escorcia', total: 19000, subtotal: 14000, shipping: 5000, items: [{ id: 'item3', name: 'Hamburguesa Clásica Copiway', quantity: 1, finalPrice: 14000, isCustom: false, extras: [] }], address: 'Calle 10 # 5-20, Centro', date: new Date().toISOString() }
];

const INITIAL_INGREDIENTS = [
  { id: 'b1', name: 'Pan de Hamburguesa', price: 1500, category: 'base', stock: 100 },
  { id: 'b2', name: 'Pan de Perro', price: 1200, category: 'base', stock: 100 },
  { id: 'e3', name: 'Carne 120g', price: 4000, category: 'extra', stock: 10 },
  { id: 'e4', name: 'Salchicha', price: 2500, category: 'extra', stock: 50 },
  { id: 'e1', name: 'Tocineta', price: 4000, category: 'extra', stock: 50 },
  { id: 'e2', name: 'Queso Cheddar', price: 3000, category: 'extra', stock: 0 },
  { id: 'v1', name: 'Lechuga', price: 1000, category: 'vegetal', stock: 200 },
  { id: 'v2', name: 'Tomate', price: 1000, category: 'vegetal', stock: 200 },
  { id: 'v3', name: 'Cebolla', price: 1000, category: 'vegetal', stock: 200 }
];

const INITIAL_CLIENTS = [
  { id: '1', name: 'Juan Pérez', phone: '3001234567', email: 'juan.perez@email.com', address: 'Cra 51B # 82-254, Apto 301', ordersCount: 5, totalSpent: 125000, points: 150, lastOrderDate: new Date().toISOString() },
  { id: '2', name: 'María Gómez', phone: '3109876543', email: 'maria.gomez@email.com', address: 'Calle 84 # 46-20, Local 2', ordersCount: 2, totalSpent: 42000, points: 40, lastOrderDate: new Date().toISOString() },
  { id: '3', name: 'Carlos Díaz', phone: '3151122334', email: 'carlos.diaz@email.com', address: 'Cra 43 # 70-12', ordersCount: 8, totalSpent: 210000, points: 300, lastOrderDate: new Date().toISOString() }
];

const INITIAL_SETTINGS = {
  openTime: '11:00',
  closeTime: '23:00',
  isOpen: true,
  shippingRate: 5000,
  categories: DEFAULT_MENU_CATEGORIES
};

export default function FirebaseSync() {
  const { setProducts, setInventory, setStaff, setOrders, setIngredients, setClients, setStoreConfig } = useStore();

  useEffect(() => {
    const seedData = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const ordersSnap = await getDocs(collection(db, 'orders'));
        if (snap.empty || ordersSnap.size < 4) {
          INITIAL_PRODUCTS.forEach(p => setDoc(doc(db, 'products', p.id), p));
          INITIAL_INVENTORY.forEach(i => setDoc(doc(db, 'inventory', i.id), i));
          INITIAL_STAFF.forEach(s => setDoc(doc(db, 'staff', s.id), s));
          INITIAL_ORDERS.forEach(o => setDoc(doc(db, 'orders', o.id), o));
          INITIAL_INGREDIENTS.forEach(i => setDoc(doc(db, 'ingredients', i.id), i));
          setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
        }
        
        const clientsSnap = await getDocs(collection(db, 'clients'));
        if (clientsSnap.empty) {
          INITIAL_CLIENTS.forEach(c => setDoc(doc(db, 'clients', c.id), c));
        }
      } catch(e) {
        console.error("Firebase Sync Seed Error:", e);
      }
    };
    seedData();

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      snapshot.docs.forEach(docSnap => {
        const product = docSnap.data();
        if (
          product.name === 'Burger Especial Copiway' || 
          product.name === 'Classic Smash' ||
          product.name === 'Burger Clásica Copiway'
        ) {
          deleteDoc(doc(db, 'products', docSnap.id)).catch(() => {});
        }
      });
    }, (error) => console.error(error));

    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(data);
    }, (error) => console.error(error));

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(data);
    }, (error) => console.error(error));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(data);
    }, (error) => console.error(error));

    const unsubIngredients = onSnapshot(collection(db, 'ingredients'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient));
      setIngredients(data);
    }, (error) => console.error(error));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setClients(data);
    }, (error) => console.error(error));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const configData = docSnap.data() as any;
        if (!configData.categories || !Array.isArray(configData.categories) || configData.categories.length === 0) {
          configData.categories = DEFAULT_MENU_CATEGORIES;
        }
        setStoreConfig(configData);
      }
    }, (error) => console.error(error));

    return () => {
      unsubProducts();
      unsubInventory();
      unsubStaff();
      unsubOrders();
      unsubIngredients();
      unsubClients();
      unsubSettings();
    };
  }, [setProducts, setInventory, setStaff, setOrders, setIngredients, setClients, setStoreConfig]);

  return null;
}
