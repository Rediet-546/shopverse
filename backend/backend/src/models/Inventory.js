const mongoose = require('mongoose');
const logger = require('../utils/logger');

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    unique: true,
    index: true
  },
  warehouses: [{
    warehouseId: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Available quantity cannot be negative']
    },
    locationDetails: {
      aisle: String,
      rack: String,
      bin: String,
      shelf: String
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    },
    lastRestocked: Date,
    lastCounted: Date,
    nextRestockDate: Date,
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0
    },
    maxStockLevel: {
      type: Number,
      default: 1000,
      min: 0
    },
    reorderPoint: {
      type: Number,
      default: 20,
      min: 0
    }
  }],
  totalQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock',
    index: true
  },
  movements: [{
    type: {
      type: String,
      enum: ['restock', 'sale', 'return', 'transfer', 'adjustment', 'reserve', 'release'],
      required: true
    },
    warehouseId: String,
    quantity: {
      type: Number,
      required: true
    },
    previousQuantity: Number,
    newQuantity: Number,
    reference: {
      type: String,
      trim: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    date: {
      type: Date,
      default: Date.now
    },
    metadata: {
      reason: String,
      batchNumber: String,
      supplierId: String,
      purchaseOrderNumber: String
    }
  }],
  reorderHistory: [{
    reorderPoint: Number,
    currentQuantity: Number,
    quantityOrdered: Number,
    supplierId: String,
    orderDate: Date,
    expectedDelivery: Date,
    actualDelivery: Date,
    status: {
      type: String,
      enum: ['pending', 'ordered', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    }
  }],
  productAttributes: {
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    barcode: {
      type: String,
      trim: true
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'g', 'lb', 'oz'],
        default: 'kg'
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'mm'],
        default: 'cm'
      }
    },
    perishable: {
      type: Boolean,
      default: false
    },
    expiryDate: Date,
    batchTracking: {
      type: Boolean,
      default: false
    },
    serialTracking: {
      type: Boolean,
      default: false
    }
  },
  supplier: {
    supplierId: String,
    name: String,
    contactEmail: String,
    contactPhone: String,
    leadTime: {
      type: Number,
      default: 3,
      min: 0
    }, // days
    minimumOrderQuantity: {
      type: Number,
      default: 10,
      min: 0
    },
    preferredSupplier: {
      type: Boolean,
      default: false
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastRestocked: Date,
  nextRestockDate: Date,
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
inventorySchema.virtual('isLowStock').get(function() {
  return this.availableQuantity > 0 && 
         this.availableQuantity <= this.getLowStockThreshold();
});

inventorySchema.virtual('isOutOfStock').get(function() {
  return this.availableQuantity <= 0;
});

inventorySchema.virtual('isOverStock').get(function() {
  return this.totalQuantity > this.getMaxStockLevel();
});

// Indexes
inventorySchema.index({ productId: 1 });
inventorySchema.index({ status: 1, availableQuantity: 1 });
inventorySchema.index({ 'warehouses.warehouseId': 1 });
inventorySchema.index({ 'productAttributes.sku': 1 });
inventorySchema.index({ 'productAttributes.barcode': 1 });
inventorySchema.index({ 'supplier.supplierId': 1 });
inventorySchema.index({ 'movements.date': -1 });
inventorySchema.index({ lastUpdated: -1 });

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  try {
    // Calculate total quantity
    this.totalQuantity = this.warehouses.reduce((sum, w) => sum + w.quantity, 0);
    
    // Calculate reserved quantity
    this.reservedQuantity = this.warehouses.reduce((sum, w) => sum + w.reservedQuantity, 0);
    
    // Calculate available quantity
    this.availableQuantity = this.totalQuantity - this.reservedQuantity;
    
    // Update status
    this.status = this.getStatus();
    
    // Update warehouse available quantities
    this.warehouses.forEach(warehouse => {
      warehouse.availableQuantity = warehouse.quantity - warehouse.reservedQuantity;
    });
    
    // Update lastUpdated
    this.lastUpdated = new Date();
    
    next();
  } catch (error) {
    logger.error('Error in inventory pre-save middleware:', error);
    next(error);
  }
});

// Instance methods
inventorySchema.methods.getStatus = function() {
  if (this.availableQuantity <= 0) {
    return 'out_of_stock';
  } else if (this.availableQuantity <= this.getLowStockThreshold()) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
};

inventorySchema.methods.getLowStockThreshold = function() {
  // Return the lowest reorder point among warehouses
  return Math.min(...this.warehouses.map(w => w.reorderPoint || 10));
};

inventorySchema.methods.getMaxStockLevel = function() {
  // Return the highest max stock level among warehouses
  return Math.max(...this.warehouses.map(w => w.maxStockLevel || 1000));
};

inventorySchema.methods.reserveStock = async function(quantity, warehouseId = null, reference = '') {
  try {
    if (this.availableQuantity < quantity) {
      throw new Error(`Insufficient stock. Available: ${this.availableQuantity}, Requested: ${quantity}`);
    }
    
    let remainingToReserve = quantity;
    
    if (warehouseId) {
      const warehouse = this.warehouses.find(w => w.warehouseId === warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse ${warehouseId} not found`);
      }
      if (warehouse.availableQuantity < quantity) {
        throw new Error(`Insufficient stock in warehouse ${warehouseId}`);
      }
      warehouse.reservedQuantity += quantity;
      remainingToReserve = 0;
    } else {
      // Reserve from warehouses in order (FIFO)
      for (const warehouse of this.warehouses) {
        if (remainingToReserve <= 0) break;
        if (warehouse.availableQuantity <= 0) continue;
        
        const toReserve = Math.min(remainingToReserve, warehouse.availableQuantity);
        warehouse.reservedQuantity += toReserve;
        remainingToReserve -= toReserve;
      }
    }
    
    if (remainingToReserve > 0) {
      throw new Error(`Insufficient stock across all warehouses`);
    }
    
    // Record movement
    this.movements.push({
      type: 'reserve',
      warehouseId: warehouseId || 'all',
      quantity,
      previousQuantity: this.availableQuantity,
      newQuantity: this.availableQuantity - quantity,
      reference,
      date: new Date(),
      notes: `Reserved ${quantity} units`
    });
    
    await this.save();
    logger.info(`Reserved ${quantity} units of product ${this.productId}`);
    return this;
    
  } catch (error) {
    logger.error(`Error reserving stock: ${error.message}`);
    throw error;
  }
};

inventorySchema.methods.releaseStock = async function(quantity, warehouseId = null, reference = '') {
  try {
    let remainingToRelease = quantity;
    
    if (warehouseId) {
      const warehouse = this.warehouses.find(w => w.warehouseId === warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse ${warehouseId} not found`);
      }
      if (warehouse.reservedQuantity < quantity) {
        throw new Error(`Not enough reserved stock in warehouse ${warehouseId}`);
      }
      warehouse.reservedQuantity -= quantity;
      remainingToRelease = 0;
    } else {
      // Release from warehouses in order (LIFO for reserved)
      for (const warehouse of [...this.warehouses].reverse()) {
        if (remainingToRelease <= 0) break;
        if (warehouse.reservedQuantity <= 0) continue;
        
        const toRelease = Math.min(remainingToRelease, warehouse.reservedQuantity);
        warehouse.reservedQuantity -= toRelease;
        remainingToRelease -= toRelease;
      }
    }
    
    if (remainingToRelease > 0) {
      throw new Error(`Not enough reserved stock across all warehouses`);
    }
    
    // Record movement
    this.movements.push({
      type: 'release',
      warehouseId: warehouseId || 'all',
      quantity,
      previousQuantity: this.availableQuantity + quantity,
      newQuantity: this.availableQuantity,
      reference,
      date: new Date(),
      notes: `Released ${quantity} units`
    });
    
    await this.save();
    logger.info(`Released ${quantity} units of product ${this.productId}`);
    return this;
    
  } catch (error) {
    logger.error(`Error releasing stock: ${error.message}`);
    throw error;
  }
};

inventorySchema.methods.updateStock = async function(quantity, type, warehouseId = null, reference = '', notes = '') {
  try {
    if (type === 'restock') {
      if (warehouseId) {
        const warehouse = this.warehouses.find(w => w.warehouseId === warehouseId);
        if (!warehouse) {
          throw new Error(`Warehouse ${warehouseId} not found`);
        }
        warehouse.quantity += quantity;
        warehouse.lastRestocked = new Date();
        warehouse.lastCounted = new Date();
      } else {
        // Distribute restock evenly across warehouses
        const perWarehouse = Math.floor(quantity / this.warehouses.length);
        const remainder = quantity % this.warehouses.length;
        
        this.warehouses.forEach((warehouse, index) => {
          const extra = index < remainder ? 1 : 0;
          warehouse.quantity += perWarehouse + extra;
          warehouse.lastRestocked = new Date();
          warehouse.lastCounted = new Date();
        });
      }
      
      this.lastRestocked = new Date();
      
    } else if (type === 'sale') {
      if (warehouseId) {
        const warehouse = this.warehouses.find(w => w.warehouseId === warehouseId);
        if (!warehouse) {
          throw new Error(`Warehouse ${warehouseId} not found`);
        }
        if (warehouse.quantity < quantity) {
          throw new Error(`Insufficient stock in warehouse ${warehouseId}`);
        }
        warehouse.quantity -= quantity;
        // Release reserved stock if any
        const reservedToRelease = Math.min(quantity, warehouse.reservedQuantity);
        if (reservedToRelease > 0) {
          warehouse.reservedQuantity -= reservedToRelease;
        }
      } else {
        // Deduct from warehouses with most stock first
        let remainingToDeduct = quantity;
        const sortedWarehouses = [...this.warehouses]
          .filter(w => w.quantity > 0)
          .sort((a, b) => b.quantity - a.quantity);
        
        for (const warehouse of sortedWarehouses) {
          if (remainingToDeduct <= 0) break;
          
          const toDeduct = Math.min(remainingToDeduct, warehouse.quantity);
          warehouse.quantity -= toDeduct;
          
          // Release reserved stock
          const reservedToRelease = Math.min(toDeduct, warehouse.reservedQuantity);
          if (reservedToRelease > 0) {
            warehouse.reservedQuantity -= reservedToRelease;
          }
          
          remainingToDeduct -= toDeduct;
        }
        
        if (remainingToDeduct > 0) {
          throw new Error(`Insufficient stock across all warehouses`);
        }
      }
      
    } else if (type === 'adjustment') {
      if (warehouseId) {
        const warehouse = this.warehouses.find(w => w.warehouseId === warehouseId);
        if (!warehouse) {
          throw new Error(`Warehouse ${warehouseId} not found`);
        }
        warehouse.quantity += quantity;
        warehouse.lastCounted = new Date();
      } else {
        // Adjust all warehouses proportionally
        const totalCurrent = this.totalQuantity || 1;
        this.warehouses.forEach(warehouse => {
          const proportion = warehouse.quantity / totalCurrent;
          const adjustment = Math.round(quantity * proportion);
          warehouse.quantity += adjustment;
          warehouse.lastCounted = new Date();
        });
      }
    }
    
    // Record movement
    this.movements.push({
      type,
      warehouseId: warehouseId || 'all',
      quantity: Math.abs(quantity),
      previousQuantity: this.totalQuantity,
      newQuantity: this.totalQuantity + quantity,
      reference,
      date: new Date(),
      notes: notes || `${type} ${Math.abs(quantity)} units`
    });
    
    await this.save();
    logger.info(`Updated stock: ${type} ${Math.abs(quantity)} units of product ${this.productId}`);
    return this;
    
  } catch (error) {
    logger.error(`Error updating stock: ${error.message}`);
    throw error;
  }
};

inventorySchema.methods.transferStock = async function(
  fromWarehouseId, 
  toWarehouseId, 
  quantity, 
  reference = ''
) {
  try {
    const fromWarehouse = this.warehouses.find(w => w.warehouseId === fromWarehouseId);
    const toWarehouse = this.warehouses.find(w => w.warehouseId === toWarehouseId);
    
    if (!fromWarehouse) {
      throw new Error(`Source warehouse ${fromWarehouseId} not found`);
    }
    if (!toWarehouse) {
      throw new Error(`Destination warehouse ${toWarehouseId} not found`);
    }
    if (fromWarehouse.quantity < quantity) {
      throw new Error(`Insufficient stock in source warehouse`);
    }
    
    fromWarehouse.quantity -= quantity;
    fromWarehouse.lastCounted = new Date();
    toWarehouse.quantity += quantity;
    toWarehouse.lastCounted = new Date();
    
    // Record movement
    this.movements.push({
      type: 'transfer',
      warehouseId: `${fromWarehouseId}->${toWarehouseId}`,
      quantity,
      previousQuantity: this.totalQuantity,
      newQuantity: this.totalQuantity,
      reference,
      date: new Date(),
      notes: `Transferred ${quantity} units from ${fromWarehouseId} to ${toWarehouseId}`
    });
    
    await this.save();
    logger.info(`Transferred ${quantity} units from ${fromWarehouseId} to ${toWarehouseId}`);
    return this;
    
  } catch (error) {
    logger.error(`Error transferring stock: ${error.message}`);
    throw error;
  }
};

inventorySchema.methods.checkLowStock = function() {
  const lowStockItems = [];
  
  this.warehouses.forEach(warehouse => {
    if (warehouse.quantity <= warehouse.reorderPoint && warehouse.quantity > 0) {
      lowStockItems.push({
        warehouseId: warehouse.warehouseId,
        currentQuantity: warehouse.quantity,
        reorderPoint: warehouse.reorderPoint
      });
    }
  });
  
  return lowStockItems;
};

inventorySchema.methods.generateReorder = function() {
  const reorderNeeded = [];
  
  this.warehouses.forEach(warehouse => {
    if (warehouse.quantity <= warehouse.reorderPoint) {
      const quantityToOrder = warehouse.maxStockLevel - warehouse.quantity;
      reorderNeeded.push({
        warehouseId: warehouse.warehouseId,
        quantityToOrder,
        currentQuantity: warehouse.quantity,
        reorderPoint: warehouse.reorderPoint
      });
    }
  });
  
  return reorderNeeded;
};

// Static methods
inventorySchema.statics.getLowStockItems = function(threshold = 10) {
  return this.find({
    availableQuantity: { $gte: 0, $lte: threshold },
    status: { $ne: 'out_of_stock' }
  }).populate('productId', 'name category price');
};

inventorySchema.statics.getOutOfStockItems = function() {
  return this.find({
    availableQuantity: { $lte: 0 },
    status: 'out_of_stock'
  }).populate('productId', 'name category price');
};

inventorySchema.statics.getWarehouseInventory = function(warehouseId) {
  return this.find({
    'warehouses.warehouseId': warehouseId,
    'warehouses.quantity': { $gt: 0 }
  }).populate('productId', 'name category price');
};

inventorySchema.statics.getProductInventoryHistory = function(productId, days = 30) {
  const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findOne({ productId })
    .select('movements')
    .then(inventory => {
      if (!inventory) return [];
      return inventory.movements
        .filter(m => m.date > dateLimit)
        .sort((a, b) => b.date - a.date);
    });
};

// Cleanup old movement records
inventorySchema.statics.cleanupMovements = async function(days = 90) {
  try {
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const inventories = await this.find({});
    
    let totalRemoved = 0;
    for (const inventory of inventories) {
      const initialLength = inventory.movements.length;
      inventory.movements = inventory.movements.filter(m => m.date > threshold);
      const removed = initialLength - inventory.movements.length;
      totalRemoved += removed;
      
      if (removed > 0) {
        await inventory.save();
      }
    }
    
    logger.info(`Cleaned up ${totalRemoved} old movement records`);
    return totalRemoved;
    
  } catch (error) {
    logger.error('Error cleaning up movements:', error);
    throw error;
  }
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;