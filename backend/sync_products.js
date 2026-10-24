const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petracement_db';

const PRODUCTS = [
  // RAMCO
  {
    name: 'Ramco Supergrade PPC',
    subtitle: 'Portland Pozzolana (Fly-Ash Based)',
    brand: 'Ramco Cement',
    brandId: 'ramco',
    price: 390,
    stock: 920,
    images: ['/cements/ramco-supergrade.png'],
    image: '/cements/ramco-supergrade.png',
    status: 'active',
    specs: {
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      standard: 'IS 1489 (Part 1)'
    }
  },
  {
    name: 'Ramco OPC 53 Grade',
    subtitle: 'Ordinary Portland 53 Grade',
    brand: 'Ramco Cement',
    brandId: 'ramco',
    price: 415,
    stock: 1200,
    images: ['/cements/ramco-53-grade.png'],
    image: '/cements/ramco-53-grade.png',
    status: 'active',
    specs: {
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      standard: 'IS 12269'
    }
  },
  {
    name: 'Ramco Supercoast PSC',
    subtitle: 'Portland Slag Cement',
    brand: 'Ramco Cement',
    brandId: 'ramco',
    price: 395,
    stock: 850,
    images: ['/cements/ramco-super-coast.jpg'],
    image: '/cements/ramco-super-coast.jpg',
    status: 'active',
    specs: {
      grade: 'PSC',
      type: 'PSC (Portland Slag Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      standard: 'IS 455'
    }
  },
  {
    name: 'Ramco Super Steel Cement',
    subtitle: 'Premium Structural Cement',
    brand: 'Ramco Cement',
    brandId: 'ramco',
    price: 510,
    stock: 650,
    images: ['/cements/ramco-super-steel.png'],
    image: '/cements/ramco-super-steel.png',
    status: 'active',
    specs: {
      grade: 'White',
      type: 'Super Structural Cement',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      standard: 'IS 8042'
    }
  },

  // ULTRATECH
  {
    name: 'UltraTech Super PPC',
    subtitle: "The Engineer's Choice - Fly Ash Based",
    brand: 'UltraTech Cement',
    brandId: 'ultratech',
    price: 400,
    stock: 1500,
    images: ['/cements/ultratech-super-ppc.png'],
    image: '/cements/ultratech-super-ppc.png',
    status: 'active',
    specs: {
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Laminated Sack Bag',
      brand: 'UltraTech Cement',
      standard: 'IS 1489 (Part 1)'
    }
  },
  {
    name: 'UltraTech OPC 53 Grade',
    subtitle: 'Structural High Strength Ordinary Portland',
    brand: 'UltraTech Cement',
    brandId: 'ultratech',
    price: 425,
    stock: 1400,
    images: ['/cements/ultratech-opc.jpg'],
    image: '/cements/ultratech-opc.jpg',
    status: 'active',
    specs: {
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingSize: '50 kg',
      packagingType: 'HDPE Laminated Sack Bag',
      brand: 'UltraTech Cement',
      standard: 'IS 12269'
    }
  },
  {
    name: 'UltraTech Weather Plus',
    subtitle: 'Water Repellent Advanced Cement',
    brand: 'UltraTech Cement',
    brandId: 'ultratech',
    price: 440,
    stock: 800,
    images: ['/cements/ultratech-weather-plus.jpg'],
    image: '/cements/ultratech-weather-plus.jpg',
    status: 'active',
    specs: {
      grade: 'PSC',
      type: 'Water Repellent Cement',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'UltraTech Cement',
      standard: 'IS 455'
    }
  },
  {
    name: 'Birla White Cement',
    subtitle: 'White Portland Architectural Cement (UltraTech Unit)',
    brand: 'UltraTech Cement',
    brandId: 'ultratech',
    price: 530,
    stock: 500,
    images: ['/cements/ultratech-white.png'],
    image: '/cements/ultratech-white.png',
    status: 'active',
    specs: {
      grade: 'White',
      type: 'White Portland Cement',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'UltraTech Cement',
      standard: 'IS 8042'
    }
  },

  // DALMIA
  {
    name: 'Dalmia DSP Cement',
    subtitle: 'Dhalai Special PPC - Void Free Concrete',
    brand: 'Dalmia Cement',
    brandId: 'dalmia',
    price: 395,
    stock: 1100,
    images: ['/cements/dalmia-dsp.png'],
    image: '/cements/dalmia-dsp.png',
    status: 'active',
    specs: {
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Dalmia Cement',
      standard: 'IS 1489 (Part 1)'
    }
  },
  {
    name: 'Dalmia OPC 53 Grade',
    subtitle: 'High Grade Heavy Strength',
    brand: 'Dalmia Cement',
    brandId: 'dalmia',
    price: 415,
    stock: 950,
    images: ['/cements/dalmia-53-grade.jpg'],
    image: '/cements/dalmia-53-grade.jpg',
    status: 'active',
    specs: {
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Dalmia Cement',
      standard: 'IS 12269'
    }
  },
  {
    name: 'Dalmia Infra Pro PSC',
    subtitle: 'Eco-Friendly Infra Slag Cement',
    brand: 'Dalmia Cement',
    brandId: 'dalmia',
    price: 385,
    stock: 750,
    images: ['/cements/dalmia-infra-pro.png'],
    image: '/cements/dalmia-infra-pro.png',
    status: 'active',
    specs: {
      grade: 'PSC',
      type: 'PSC (Portland Slag Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Dalmia Cement',
      standard: 'IS 455'
    }
  },

  // JSW
  {
    name: 'JSW Concreel HD PPC',
    subtitle: 'Heavy Duty Structural Cement',
    brand: 'JSW Cement',
    brandId: 'jsw',
    price: 390,
    stock: 890,
    images: ['/cements/jsw-concreel-hd.png'],
    image: '/cements/jsw-concreel-hd.png',
    status: 'active',
    specs: {
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'JSW Cement',
      standard: 'IS 1489'
    }
  },
  {
    name: 'JSW OPC 53 Grade',
    subtitle: 'Ordinary Portland 53 Grade',
    brand: 'JSW Cement',
    brandId: 'jsw',
    price: 410,
    stock: 920,
    images: ['/cements/jsw-opc.png'],
    image: '/cements/jsw-opc.png',
    status: 'active',
    specs: {
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'JSW Cement',
      standard: 'IS 12269'
    }
  },
  {
    name: 'JSW Composite Slag Cement',
    subtitle: 'Slag Blended Durable Cement',
    brand: 'JSW Cement',
    brandId: 'jsw',
    price: 380,
    stock: 680,
    images: ['/cements/jsw-compcem.png'],
    image: '/cements/jsw-compcem.png',
    status: 'active',
    specs: {
      grade: 'PSC',
      type: 'PSC (Portland Slag Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'JSW Cement',
      standard: 'IS 455'
    }
  },

  // ZUARI
  {
    name: 'Zuari Super PPC Cement',
    subtitle: 'Italcementi Group Quality',
    brand: 'Zuari Cement',
    brandId: 'zuari',
    price: 385,
    stock: 610,
    images: ['/cements/zuari-ppc.png'],
    image: '/cements/zuari-ppc.png',
    status: 'active',
    specs: {
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Zuari Cement',
      standard: 'IS 1489'
    }
  },
  {
    name: 'Zuari OPC 53 Grade',
    subtitle: 'Structural Grade Cement',
    brand: 'Zuari Cement',
    brandId: 'zuari',
    price: 405,
    stock: 580,
    images: ['/cements/zuari-opc.jpg'],
    image: '/cements/zuari-opc.jpg',
    status: 'active',
    specs: {
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Zuari Cement',
      standard: 'IS 12269'
    }
  },

  // MAHA CEMENT (EXACT 2 PRODUCTS MATCHING MOBILE APP!)
  {
    name: 'Maha Gold PPC Cement',
    subtitle: 'Build It Strong Fly-Ash Pozzolana',
    brand: 'Maha Cement',
    brandId: 'maha',
    price: 380,
    stock: 850,
    images: ['/cements/maha-bag.png'],
    image: '/cements/maha-bag.png',
    status: 'active',
    specs: {
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Maha Cement',
      standard: 'IS 1489'
    }
  },
  {
    name: 'Maha OPC 53 Grade',
    subtitle: 'Build It Strong Structural Ordinary Portland',
    brand: 'Maha Cement',
    brandId: 'maha',
    price: 400,
    stock: 720,
    images: ['/cements/maha-bag.png'],
    image: '/cements/maha-bag.png',
    status: 'active',
    specs: {
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingSize: '50 kg',
      packagingType: 'HDPE Sack Bag',
      brand: 'Maha Cement',
      standard: 'IS 12269'
    }
  }
];

async function syncCatalog() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Sync] Connected to MongoDB at', MONGODB_URI);

    const collection = mongoose.connection.collection('products');
    
    // Clear old products to ensure clean exact 18 items
    await collection.deleteMany({});
    console.log('[Sync] Cleared old products collection.');

    // Insert the exact 18 products
    const now = new Date();
    const docs = PRODUCTS.map(p => ({
      ...p,
      isFeatured: false,
      featured: false,
      createdAt: now,
      updatedAt: now
    }));

    const result = await collection.insertMany(docs);
    console.log(`[Sync] Successfully inserted ${result.insertedCount} products exactly matching Mobile App!`);

    const mahaProds = await collection.find({ brandId: 'maha' }).toArray();
    console.log('[Sync] Verified Maha Cement products in DB:');
    mahaProds.forEach(p => console.log(` - ${p.name} (${p.specs.grade}) - ₹${p.price}`));

    await mongoose.disconnect();
    console.log('[Sync] Database synchronization finished successfully!');
  } catch (err) {
    console.error('[Sync] Error syncing products:', err);
    process.exit(1);
  }
}

syncCatalog();
