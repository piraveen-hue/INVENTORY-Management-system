import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: string;
  low_stock_threshold: number;
  description: string;
  created_at: string;
  is_low_stock?: boolean;
}

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'manager' | 'staff' | 'viewer';
  avatar: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_ADJUST';
  productName: string;
  sku?: string;
  userName: string;
  userRole?: string;
  details: string;
  quantityDelta?: number;
  quantityAfter?: number;
}

const users: User[] = [
  {
    id: "usr_1",
    username: "admin",
    password: "admin123",
    name: "Sarah Connor",
    role: "manager",
    avatar: "👩‍💼"
  },
  {
    id: "usr_2",
    username: "staff",
    password: "staff123",
    name: "Alex Rivera",
    role: "staff",
    avatar: "👨‍🔧"
  },
  {
    id: "usr_3",
    username: "viewer",
    password: "viewer123",
    name: "Jordan Lee",
    role: "viewer",
    avatar: "👤"
  }
];

const sessions = new Map<string, User>();
// Pre-populate demo sessions
sessions.set("demo_token_admin", users[0]);
sessions.set("demo_token_staff", users[1]);

let activityLogs: ActivityLog[] = [
  {
    id: "act_1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    action: "STOCK_ADJUST",
    productName: "Noise-Cancelling Headphones",
    sku: "SKU-AUDI-501",
    userName: "Alex Rivera",
    userRole: "staff",
    details: "Restocked shipment from manufacturer",
    quantityDelta: 10,
    quantityAfter: 25
  },
  {
    id: "act_2",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    action: "STOCK_ADJUST",
    productName: "Ergonomic Office Chair",
    sku: "SKU-FURN-101",
    userName: "Alex Rivera",
    userRole: "staff",
    details: "Fulfilled corporate office order #4081",
    quantityDelta: -2,
    quantityAfter: 4
  },
  {
    id: "act_3",
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    action: "CREATE",
    productName: "Noise-Cancelling Headphones",
    sku: "SKU-AUDI-501",
    userName: "Sarah Connor",
    userRole: "manager",
    details: "New catalog item added with initial stock of 15 units"
  }
];

let nextId = 7;
let products: Product[] = [
  {
    id: 1,
    sku: "SKU-FURN-101",
    name: "Ergonomic Office Chair",
    category: "Furniture",
    quantity: 4,
    price: "189.99",
    low_stock_threshold: 10,
    description: "High-back mesh chair with lumbar support and 3D adjustable armrests.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    sku: "SKU-ELEC-204",
    name: "Wireless Mechanical Keyboard",
    category: "Electronics",
    quantity: 18,
    price: "89.50",
    low_stock_threshold: 10,
    description: "Hot-swappable mechanical switches with RGB backlighting and Bluetooth 5.2.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 3,
    sku: "SKU-ELEC-305",
    name: "27-inch 4K UHD Monitor",
    category: "Electronics",
    quantity: 3,
    price: "349.00",
    low_stock_threshold: 5,
    description: "IPS panel with HDR400, 99% sRGB coverage, and USB-C 65W power delivery.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 4,
    sku: "SKU-FURN-108",
    name: "Electric Standing Desk",
    category: "Furniture",
    quantity: 12,
    price: "420.00",
    low_stock_threshold: 5,
    description: "Dual-motor motorized height adjustable desk frame with solid bamboo tabletop.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 5,
    sku: "SKU-ACCS-402",
    name: "USB-C Multiport Hub",
    category: "Accessories",
    quantity: 2,
    price: "39.99",
    low_stock_threshold: 8,
    description: "7-in-1 adapter with 4K HDMI, 100W PD charging, SD card reader, and 3x USB 3.0.",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 6,
    sku: "SKU-AUDI-501",
    name: "Noise-Cancelling Headphones",
    category: "Audio",
    quantity: 25,
    price: "199.95",
    low_stock_threshold: 10,
    description: "Over-ear active noise cancellation with 40-hour battery life and transparency mode.",
    created_at: new Date().toISOString(),
  }
];

function generateSku(category: string, id: number): string {
  const prefix = (category.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'ITEM').toUpperCase();
  return `SKU-${prefix}-${String(id).padStart(3, '0')}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'public')));

  // CORS middleware matching Django corsheaders
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper to extract authenticated user
  function getAuthUser(req: express.Request): User | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7).trim();
    return sessions.get(token) || null;
  }

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: "Username and password are required." });
    }

    const user = users.find(
      u => u.username.toLowerCase() === String(username).trim().toLowerCase() && u.password === String(password)
    );

    if (!user) {
      return res.status(401).json({ detail: "Invalid credentials. Try admin / admin123 or staff / staff123." });
    }

    const token = `token_${user.username}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    sessions.set(token, user);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ detail: "Username, password, and full name are required." });
    }

    const trimmedUser = String(username).trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === trimmedUser)) {
      return res.status(400).json({ detail: `Username '${username}' is already taken.` });
    }

    const userRole = (role === 'manager' || role === 'staff') ? role : 'staff';
    const avatar = userRole === 'manager' ? '👩‍💼' : '👨‍🔧';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: String(username).trim(),
      password: String(password),
      name: String(name).trim(),
      role: userRole,
      avatar
    };

    users.push(newUser);
    const token = `token_${newUser.username}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    sessions.set(token, newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar
      }
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ detail: "Unauthenticated" });
    }
    res.status(200).json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      sessions.delete(token);
    }
    res.status(200).json({ message: "Logged out successfully" });
  });

  // --- ACTIVITY LOG ENDPOINT ---
  app.get('/api/activity-logs/', (req, res) => {
    const sorted = [...activityLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.status(200).json(sorted);
  });

  // REST API: GET /api/products/
  app.get('/api/products/', (req, res) => {
    let result = [...products];

    // Search by product name, SKU or description
    const searchQuery = req.query.search as string;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || 
             (p.sku && p.sku.toLowerCase().includes(q)) ||
             (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filter by category (exact match)
    const categoryQuery = req.query.category as string;
    if (categoryQuery && categoryQuery.trim() && categoryQuery.toLowerCase() !== 'all') {
      const cat = categoryQuery.trim().toLowerCase();
      result = result.filter(p => p.category.toLowerCase() === cat);
    }

    // Filter by stock level
    const stockStatus = req.query.stock_status as string;
    if (stockStatus) {
      if (stockStatus === 'low') {
        result = result.filter(p => p.quantity <= p.low_stock_threshold && p.quantity > 0);
      } else if (stockStatus === 'out') {
        result = result.filter(p => p.quantity === 0);
      } else if (stockStatus === 'healthy') {
        result = result.filter(p => p.quantity > p.low_stock_threshold);
      }
    }

    // Compute is_low_stock and sort by created_at descending
    result = result.map(p => ({
      ...p,
      is_low_stock: p.quantity <= p.low_stock_threshold,
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.status(200).json(result);
  });

  // REST API: GET /api/products/scan/:code
  app.get(['/api/products/scan/:code', '/api/products/scan/:code/'], (req, res) => {
    const rawCode = (req.params.code || '').trim();
    const cleanCode = rawCode.toLowerCase().replace(/[^a-z0-9]/g, '');

    const found = products.find(p => {
      const pSkuClean = p.sku.toLowerCase().replace(/[^a-z0-9]/g, '');
      const pNameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return p.sku.toLowerCase() === rawCode.toLowerCase() ||
             pSkuClean === cleanCode ||
             pNameClean === cleanCode ||
             String(p.id) === rawCode;
    });

    if (!found) {
      return res.status(404).json({ detail: `No product found matching barcode '${rawCode}'` });
    }

    res.status(200).json({
      ...found,
      is_low_stock: found.quantity <= found.low_stock_threshold,
    });
  });

  // REST API: GET /api/products/:id/
  app.get('/api/products/:id/', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ detail: "Not found." });
    }
    res.status(200).json({
      ...product,
      is_low_stock: product.quantity <= product.low_stock_threshold,
    });
  });

  // REST API: POST /api/products/:id/adjust-stock/
  app.post('/api/products/:id/adjust-stock/', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ detail: "Product not found." });
    }

    const { delta, reason, notes } = req.body;
    const deltaNum = parseInt(delta, 10);
    if (isNaN(deltaNum)) {
      return res.status(400).json({ detail: "Quantity delta must be a valid integer." });
    }

    const user = getAuthUser(req);
    const userName = user ? user.name : "Inventory Staff";
    const userRole = user ? user.role : "staff";

    const prevQty = product.quantity;
    const newQty = Math.max(0, prevQty + deltaNum);
    product.quantity = newQty;
    product.is_low_stock = newQty <= product.low_stock_threshold;

    const actionText = deltaNum >= 0 ? `+${deltaNum} units added` : `${deltaNum} units removed`;
    const reasonText = reason ? ` (${reason}${notes ? `: ${notes}` : ''})` : '';

    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: "STOCK_ADJUST",
      productName: product.name,
      sku: product.sku,
      userName,
      userRole,
      details: `${actionText}${reasonText}`,
      quantityDelta: deltaNum,
      quantityAfter: newQty
    };

    activityLogs.unshift(newLog);

    res.status(200).json({
      product,
      log: newLog
    });
  });

  // REST API: POST /api/products/
  app.post('/api/products/', (req, res) => {
    const { name, category, sku, quantity, price, low_stock_threshold, description } = req.body;

    const errors: Record<string, string[]> = {};

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.name = ["Product name cannot be empty."];
    } else {
      const trimmedName = name.trim();
      const existing = products.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) {
        errors.name = [`A product with the name '${trimmedName}' already exists.`];
      }
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      errors.category = ["Category cannot be empty."];
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      errors.quantity = ["Quantity must be a positive integer or zero (>= 0)."];
    }

    const prc = parseFloat(price);
    if (isNaN(prc) || prc < 0) {
      errors.price = ["Price must be greater than or equal to 0.00."];
    }

    const threshold = low_stock_threshold !== undefined && low_stock_threshold !== '' ? parseInt(low_stock_threshold, 10) : 10;
    if (isNaN(threshold) || threshold < 0) {
      errors.low_stock_threshold = ["Low stock threshold must be >= 0."];
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }

    const assignedId = nextId++;
    const assignedSku = (sku && typeof sku === 'string' && sku.trim())
      ? sku.trim().toUpperCase()
      : generateSku(category.trim(), assignedId);

    const newProduct: Product = {
      id: assignedId,
      sku: assignedSku,
      name: name.trim(),
      category: category.trim(),
      quantity: qty,
      price: prc.toFixed(2),
      low_stock_threshold: threshold,
      description: description ? String(description).trim() : '',
      created_at: new Date().toISOString(),
      is_low_stock: qty <= threshold,
    };

    products.push(newProduct);

    // Record audit log
    const user = getAuthUser(req);
    activityLogs.unshift({
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: "CREATE",
      productName: newProduct.name,
      sku: newProduct.sku,
      userName: user ? user.name : "Inventory Admin",
      userRole: user ? user.role : "manager",
      details: `Created new item with initial stock of ${qty} units @ $${prc.toFixed(2)}`
    });

    res.status(201).json(newProduct);
  });

  // REST API: PUT /api/products/:id/
  app.put('/api/products/:id/', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ detail: "Not found." });
    }

    const { name, category, sku, quantity, price, low_stock_threshold, description } = req.body;
    const errors: Record<string, string[]> = {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.name = ["Product name cannot be empty."];
    } else {
      const trimmedName = name.trim();
      const existing = products.find(p => p.id !== id && p.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) {
        errors.name = [`A product with the name '${trimmedName}' already exists.`];
      }
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      errors.category = ["Category cannot be empty."];
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      errors.quantity = ["Quantity must be a positive integer or zero (>= 0)."];
    }

    const prc = parseFloat(price);
    if (isNaN(prc) || prc < 0) {
      errors.price = ["Price must be greater than or equal to 0.00."];
    }

    const threshold = low_stock_threshold !== undefined && low_stock_threshold !== '' ? parseInt(low_stock_threshold, 10) : 10;
    if (isNaN(threshold) || threshold < 0) {
      errors.low_stock_threshold = ["Low stock threshold must be >= 0."];
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }

    const prevProduct = { ...products[index] };
    const updatedSku = (sku && typeof sku === 'string' && sku.trim())
      ? sku.trim().toUpperCase()
      : products[index].sku || generateSku(category.trim(), id);

    products[index] = {
      ...products[index],
      sku: updatedSku,
      name: name.trim(),
      category: category.trim(),
      quantity: qty,
      price: prc.toFixed(2),
      low_stock_threshold: threshold,
      description: description !== undefined ? String(description).trim() : products[index].description,
      is_low_stock: qty <= threshold,
    };

    // Log update
    const user = getAuthUser(req);
    activityLogs.unshift({
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: "UPDATE",
      productName: products[index].name,
      sku: products[index].sku,
      userName: user ? user.name : "Inventory Staff",
      userRole: user ? user.role : "staff",
      details: `Updated details (Qty: ${prevProduct.quantity} → ${qty}, Price: $${prevProduct.price} → $${prc.toFixed(2)})`
    });

    res.status(200).json(products[index]);
  });

  // REST API: DELETE /api/products/:id/
  app.delete('/api/products/:id/', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ detail: "Not found." });
    }
    const deleted = products.splice(index, 1)[0];

    // Log deletion
    const user = getAuthUser(req);
    activityLogs.unshift({
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: "DELETE",
      productName: deleted.name,
      sku: deleted.sku,
      userName: user ? user.name : "Inventory Admin",
      userRole: user ? user.role : "manager",
      details: `Permanently removed product from inventory`
    });

    res.status(200).json({ message: `Product '${deleted.name}' deleted successfully.` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
