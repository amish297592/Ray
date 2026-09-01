import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RAY Database with Nova Run Merchant Data...');

  // Clean existing data
  await prisma.auditEvent.deleteMany({});
  await prisma.agentSession.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productRelationship.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.aICommerceProfile.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.merchant.deleteMany({});

  // 1. Create Nova Run Merchant
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Nova Run',
      slug: 'nova-run',
      category: 'Sports & Fitness',
      currency: 'INR',
      logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=80',
      readinessScore: 92,
      catalogCompleteness: 96,
      structuredPricing: 100,
      productRelationships: 89,
      policyClarity: 94,
      checkoutReadiness: 91,
    },
  });

  console.log(`✅ Merchant Created: ${merchant.name} (${merchant.id})`);

  // 2. Create 35 Products
  const productsData = [
    {
      title: 'Nova Runner X1 Pro',
      slug: 'nova-runner-x1-pro',
      category: 'Footwear',
      price: 3999.0,
      costPrice: 1800.0,
      stock: 85,
      description: 'Engineered daily trainer with responsive nitrogen-infused foam midsole and breathable mesh upper.',
      attributesJson: JSON.stringify({
        terrain: 'Road',
        cushioning: 'High',
        archSupport: 'Neutral',
        weightGram: 245,
        sizes: [7, 8, 9, 10, 11],
        colors: ['Obsidian Black', 'Electric Blue', 'Neon Lime'],
      }),
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Performance Anti-Blister Socks (3-Pack)',
      slug: 'performance-anti-blister-socks',
      category: 'Accessories',
      price: 499.0,
      costPrice: 150.0,
      stock: 300,
      description: 'Merino wool blend running socks with seamless toe and targeted arch compression.',
      attributesJson: JSON.stringify({
        material: 'Merino Wool & Synthetic',
        packSize: 3,
        cushioning: 'Medium',
        features: ['Anti-Blister', 'Moisture Wicking', 'Arch Band'],
      }),
      imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Trail Blazer GTX All-Weather Shoe',
      slug: 'trail-blazer-gtx',
      category: 'Footwear',
      price: 4899.0,
      costPrice: 2200.0,
      stock: 45,
      description: 'Waterproof Gore-Tex trail shoe with Vibram traction lugs for extreme terrain.',
      attributesJson: JSON.stringify({
        terrain: 'Trail',
        cushioning: 'Max',
        waterproof: true,
        weightGram: 310,
        sizes: [8, 9, 10, 11],
      }),
      imageUrl: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Aeroflow Ergonomic Hydration Vest 5L',
      slug: 'aeroflow-hydration-vest-5l',
      category: 'Accessories',
      price: 2499.0,
      costPrice: 900.0,
      stock: 120,
      description: 'Lightweight race vest with dual 500ml soft flasks and phone chest pocket.',
      attributesJson: JSON.stringify({
        capacityLiters: 5,
        flasksIncluded: 2,
        weightGram: 180,
        reflective: true,
      }),
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Apex GPS Heart Rate Smartwatch',
      slug: 'apex-gps-heart-rate-smartwatch',
      category: 'Electronics',
      price: 4999.0,
      costPrice: 2800.0,
      stock: 40,
      description: 'Multi-sport smartwatch with dual-band GPS, VO2 Max estimation, and 14-day battery life.',
      attributesJson: JSON.stringify({
        screenType: 'AMOLED',
        batteryLifeDays: 14,
        waterRating: '5 ATM',
        sensors: ['Optical HR', 'Pulse Ox', 'Barometer', 'Dual GPS'],
      }),
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Deep Tissue Recovery Foam Roller',
      slug: 'deep-tissue-recovery-foam-roller',
      category: 'Accessories',
      price: 899.0,
      costPrice: 300.0,
      stock: 180,
      description: 'Grid high-density EVA foam roller for myofascial release and muscle soreness recovery.',
      attributesJson: JSON.stringify({
        density: 'High',
        lengthCm: 33,
        diameterCm: 14,
        maxWeightKg: 150,
      }),
      imageUrl: 'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Ultra-Light Breathable Running Tee',
      slug: 'ultra-light-running-tee',
      category: 'Apparel',
      price: 1199.0,
      costPrice: 400.0,
      stock: 220,
      description: 'Zero-friction laser-cut seam running t-shirt with silver-ion odor resistance.',
      attributesJson: JSON.stringify({
        fit: 'Athletic Slim',
        material: 'Recycled Polyester 88%, Elastane 12%',
        features: ['UV 50+ Protection', 'Reflective Accents'],
      }),
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'PaceMaker Carbon Plate Race Shoe',
      slug: 'pacemaker-carbon-plate-race-shoe',
      category: 'Footwear',
      price: 4999.0,
      costPrice: 2500.0,
      stock: 25,
      description: 'Marathon super-shoe featuring a full-length carbon fiber propulsion plate.',
      attributesJson: JSON.stringify({
        terrain: 'Road / Race',
        cushioning: 'Max Energy Return',
        plateType: 'Carbon Fiber',
        weightGram: 195,
      }),
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Electrolyte Energy Gel Box (12 Pack)',
      slug: 'electrolyte-energy-gel-12pack',
      category: 'Nutrition',
      price: 999.0,
      costPrice: 350.0,
      stock: 400,
      description: 'Rapid absorption carbohydrate gels with 100mg sodium and natural caffeine punch.',
      attributesJson: JSON.stringify({
        servings: 12,
        carbsPerGel: '24g',
        caffeineMg: 50,
        flavors: ['Berry Blast', 'Citrus Rush', 'Salted Caramel'],
      }),
      imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
    {
      title: 'Modular Gym & Duffel Bag 35L',
      slug: 'modular-gym-duffel-35l',
      category: 'Accessories',
      price: 2799.0,
      costPrice: 1100.0,
      stock: 90,
      description: 'Water-resistant workout duffel with ventilated shoe compartment and wet gear pocket.',
      attributesJson: JSON.stringify({
        capacityLiters: 35,
        shoeCompartment: true,
        laptopSleeve: '15 inch',
        strapStyle: 'Convertible Backpack / Duffel',
      }),
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    },
  ];

  // Fill up to 35 products programmatically for rich catalog testing
  const additionalCategories = ['Apparel', 'Accessories', 'Nutrition', 'Electronics', 'Footwear'];
  for (let i = 11; i <= 35; i++) {
    const cat = additionalCategories[i % additionalCategories.length];
    const price = Math.floor(299 + (i * 120) % 4500);
    productsData.push({
      title: `Nova Elite Pro Item #${i} (${cat})`,
      slug: `nova-elite-pro-item-${i}`,
      category: cat,
      price: Number(price.toFixed(2)),
      costPrice: Number((price * 0.45).toFixed(2)),
      stock: 50 + (i * 7) % 150,
      description: `High-performance athletic gear designed for training and daily endurance. Model Series #${i}.`,
      attributesJson: JSON.stringify({
        series: `Gen-${i}`,
        durabilityRating: 'A+',
        recommendedUse: 'Daily Training & Competition',
      }),
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
      isAiDiscoverable: true,
    });
  }

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        ...p,
        merchantId: merchant.id,
      },
    });
    createdProducts.push(prod);
  }
  console.log(`✅ ${createdProducts.length} Products Created.`);

  // 3. Create Customers & Seed Orders
  const customerNames = [
    'Aarav Sharma', 'Ananya Iyer', 'Rohan Mehta', 'Priya Nair', 'Vikram Patel',
    'Sneha Kulkarni', 'Aditya Verma', 'Diya Kapoor', 'Kabir Reddy', 'Riya Sen'
  ];

  const createdCustomers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const cust = await prisma.customer.create({
      data: {
        merchantId: merchant.id,
        name: customerNames[i],
        email: `${customerNames[i].toLowerCase().replace(' ', '.')}@example.com`,
        phone: `+9198765${10000 + i}`,
        spendingTier: i < 3 ? 'VIP' : 'REGULAR',
        totalSpent: 4500 + i * 1800,
      },
    });
    createdCustomers.push(cust);
  }

  // 4. Create 20 Product Relationships (Upsell / Cross-sell)
  const runnerShoe = createdProducts[0]; // Nova Runner X1 Pro
  const socks = createdProducts[1];      // Performance Socks
  const trailShoe = createdProducts[2];  // Trail Blazer GTX
  const vest = createdProducts[3];       // Hydration Vest
  const watch = createdProducts[4];      // Smartwatch
  const roller = createdProducts[5];     // Foam Roller
  const gel = createdProducts[8];        // Energy Gel

  const relationshipsData = [
    {
      sourceProductId: runnerShoe.id,
      targetProductId: socks.id,
      relationType: 'CROSS_SELL',
      confidence: 0.89,
      simulatedAovUplift: 499.0,
      rationale: 'Customers buying running shoes have a 42% likelihood of purchasing anti-blister performance socks.',
      status: 'ACTIVE',
    },
    {
      sourceProductId: runnerShoe.id,
      targetProductId: trailShoe.id,
      relationType: 'UPSELL',
      confidence: 0.76,
      simulatedAovUplift: 900.0,
      rationale: 'For wet/rugged runner requests, upgrading to Gore-Tex Trail Blazer delivers high durability satisfaction.',
      status: 'ACTIVE',
    },
    {
      sourceProductId: runnerShoe.id,
      targetProductId: roller.id,
      relationType: 'CROSS_SELL',
      confidence: 0.81,
      simulatedAovUplift: 899.0,
      rationale: 'Recovery bundle pairing runner shoes with foam rollers reduces post-run injury metrics.',
      status: 'ACTIVE',
    },
    {
      sourceProductId: vest.id,
      targetProductId: gel.id,
      relationType: 'CROSS_SELL',
      confidence: 0.92,
      simulatedAovUplift: 999.0,
      rationale: '9 out of 10 trail runners purchasing hydration vests add energy gel multipacks.',
      status: 'ACTIVE',
    },
    {
      sourceProductId: runnerShoe.id,
      targetProductId: watch.id,
      relationType: 'UPSELL',
      confidence: 0.68,
      simulatedAovUplift: 1000.0,
      rationale: 'High intent buyers with budget capacity show interest in dual-band GPS heart rate trackers.',
      status: 'ACTIVE',
    },
  ];

  for (const rel of relationshipsData) {
    await prisma.productRelationship.create({
      data: rel,
    });
  }
  console.log(`✅ Product Relationships Seeded.`);

  // 5. Create Campaigns
  await prisma.campaign.createMany({
    data: [
      {
        merchantId: merchant.id,
        title: 'Upgrade to Pro Running Setup',
        offerDiscountPercent: 10.0,
        targetAudience: 'High-intent runner shoe buyers',
        durationHours: 48,
        expectedRevenueImpact: 18400.0,
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      {
        merchantId: merchant.id,
        title: 'Marathon Season Hydration Bundle',
        offerDiscountPercent: 15.0,
        targetAudience: 'Long distance endurance athletes',
        durationHours: 72,
        expectedRevenueImpact: 32000.0,
        status: 'ACTIVE',
        approvedAt: new Date(),
      },
      {
        merchantId: merchant.id,
        title: 'Weekend Rush Anti-Blister Special',
        offerDiscountPercent: 5.0,
        targetAudience: 'First time shoe buyers',
        durationHours: 24,
        expectedRevenueImpact: 12500.0,
        status: 'DRAFT',
      },
    ],
  });
  console.log(`✅ Campaigns Seeded.`);

  // 6. Create Merchant Policy
  await prisma.policy.create({
    data: {
      merchantId: merchant.id,
      maxTransactionLimit: 5000.0,
      maxDailySpend: 20000.0,
      maxCartAmount: 10000.0,
      requireUserConfirmation: true,
      allowedCategoriesJson: JSON.stringify(['Footwear', 'Apparel', 'Accessories', 'Electronics', 'Nutrition', 'Sports & Fitness']),
      blockedCategoriesJson: JSON.stringify(['Gift Cards', 'Digital Subscriptions', 'Gambling']),
      isEnabled: true,
    },
  });
  console.log(`✅ Merchant Guardrail Policies Created.`);

  // 7. Create AI Commerce Profile (Passport)
  const passportObj = {
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    slug: merchant.slug,
    category: merchant.category,
    currency: merchant.currency,
    ai_readiness_score: 92,
    readiness_breakdown: {
      catalog_completeness: 96,
      structured_pricing: 100,
      product_relationships: 89,
      policy_clarity: 94,
      checkout_readiness: 91,
    },
    capabilities: {
      ai_discovery_enabled: true,
      upsell_enabled: true,
      cross_sell_enabled: true,
      razorpay_checkout: true,
      bounded_authorization: true,
    },
    policies: {
      max_transaction_limit: 5000.0,
      max_daily_spend: 20000.0,
      require_confirmation: true,
    },
    featured_products: createdProducts.slice(0, 5).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
    })),
  };

  await prisma.aICommerceProfile.create({
    data: {
      merchantId: merchant.id,
      rawPassportJson: JSON.stringify(passportObj, null, 2),
    },
  });
  console.log(`✅ AI Commerce Passport Profile Created.`);

  // 8. Seed Historical Orders & Audit Logs
  const actionIds = [
    'RAY-ACT-20260901-8F31A',
    'RAY-ACT-20260901-7E29B',
    'RAY-ACT-20260901-9C44C',
  ];

  const demoOrder = await prisma.order.create({
    data: {
      razorpayOrderId: 'order_test_9023810239',
      merchantId: merchant.id,
      customerId: createdCustomers[0].id,
      totalAmount: 4498.0,
      currency: 'INR',
      status: 'PAID',
      paymentStatus: 'CAPTURED',
      actionId: actionIds[0],
      cartItemsJson: JSON.stringify([
        { id: runnerShoe.id, title: runnerShoe.title, price: runnerShoe.price, quantity: 1 },
        { id: socks.id, title: socks.title, price: socks.price, quantity: 1 },
      ]),
    },
  });

  await prisma.payment.create({
    data: {
      orderId: demoOrder.id,
      razorpayPaymentId: 'pay_test_9023810239_sig',
      razorpaySignature: '38a9d18e8f812e9b1103c...',
      amount: 4498.0,
      currency: 'INR',
      status: 'SUCCESS',
      method: 'upi',
    },
  });

  // Seed Audit Events
  const events = [
    { actor: 'AI_BUYER', action: 'INTENT_PARSED', amount: null, status: 'SUCCESS', reason: 'Parsed: Running shoes under ₹5,000' },
    { actor: 'RAY_GROWTH_AGENT', action: 'CATALOG_SEARCHED', amount: null, status: 'SUCCESS', reason: 'Found 4 matching products in Sports & Fitness' },
    { actor: 'RAY_GROWTH_AGENT', action: 'UPSELL_RECOMMENDED', amount: 499.0, status: 'SUCCESS', reason: 'Recommended Performance Socks pairing (+12.5% AOV uplift)' },
    { actor: 'SYSTEM', action: 'POLICY_CHECK_PASSED', amount: 4498.0, status: 'SUCCESS', reason: 'Cart total ₹4,498 is within max limit ₹5,000' },
    { actor: 'MERCHANT', action: 'USER_CONFIRMED', amount: 4498.0, status: 'SUCCESS', reason: 'User explicitly authorized ₹4,498 spending limit' },
    { actor: 'SYSTEM', action: 'RAZORPAY_ORDER_CREATED', amount: 4498.0, status: 'SUCCESS', reason: 'Order order_test_9023810239 created successfully' },
    { actor: 'SYSTEM', action: 'PAYMENT_VERIFIED', amount: 4498.0, status: 'SUCCESS', reason: 'Signature HMAC verified. Captured ₹4,498' },
  ];

  for (const ev of events) {
    await prisma.auditEvent.create({
      data: {
        actionId: actionIds[0],
        orderId: demoOrder.id,
        merchantId: merchant.id,
        actor: ev.actor,
        action: ev.action,
        amount: ev.amount,
        status: ev.status,
        reason: ev.reason,
      },
    });
  }

  console.log(`✅ Seeded Historical Order & Audit Events.`);
  console.log('🚀 RAY Seed Process Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
