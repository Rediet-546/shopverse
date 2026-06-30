// backend/backend/docker/mongo/init.js
print('🚀 Starting MongoDB initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create ProductVariants user if not exists
if (!db.getUser('admin')) {
  db.createUser({
    user: 'admin',
    pwd: 'password123',
    roles: [{ role: 'root', db: 'admin' }]
  });
  print('✅ Admin user created');
}

// Switch to shopverse database
db = db.getSiblingDB('shopverse');

// Create collections
print('📊 Creating collections...');

db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('carts');
db.createCollection('inventories');
db.createCollection('analytics');

print('✅ Collections created');

// Create indexes
print('📊 Creating indexes...');

// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });

// Products collection indexes
db.products.createIndex({ name: 'text', description: 'text', category: 'text' });
db.products.createIndex({ category: 1, price: 1 });
db.products.createIndex({ vendorId: 1, createdAt: -1 });
db.products.createIndex({ isFeatured: 1, createdAt: -1 });
db.products.createIndex({ 'ratings.average': -1 });
db.products.createIndex({ finalPrice: 1 });
db.products.createIndex({ isActive: 1 });

// Orders collection indexes
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1, createdAt: 1 });
db.orders.createIndex({ 'payment.transactionId': 1 });

// Carts collection indexes
db.carts.createIndex({ userId: 1 }, { unique: true });

// Inventories collection indexes
db.inventories.createIndex({ productId: 1 }, { unique: true });

// Analytics collection indexes
db.analytics.createIndex({ date: 1, type: 1 });

print('✅ Indexes created');

// Create test users
print('👤 Creating test users...');

// Test user
db.users.insertOne({
  email: 'user@shopverse.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewd5x3aFcZ6Zn6mC',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Test vendor
db.users.insertOne({
  email: 'vendor@shopverse.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewd5x3aFcZ6Zn6mC',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'vendor',
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Test admin
db.users.insertOne({
  email: 'admin@shopverse.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewd5x3aFcZ6Zn6mC',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Test users created');
print('🎉 MongoDB initialization completed successfully!');