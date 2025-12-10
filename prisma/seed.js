const { PrismaClient, Prisma } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const categoriesData = [
  {
    name: 'Laptops & Ultrabooks',
    description: 'Performance-tuned notebooks for building, gaming, and creating on the go.',
    slug: 'laptops-ultrabooks',
    featured: true,
    accentColor: 'from-sky-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&w=1200&q=80',
  },
  {
    name: 'Smartphones & Wearables',
    description: 'Flagship devices engineered for pro-level photography and all-day productivity.',
    slug: 'smartphones-wearables',
    featured: true,
    accentColor: 'from-indigo-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&w=1200&q=80',
  },
  {
    name: 'Tablets & 2-in-1',
    description: 'Convertibles and stylus-ready tablets for sketching, editing, and presenting.',
    slug: 'tablets-2-in-1',
    featured: true,
    accentColor: 'from-cyan-500 to-teal-500',
    image: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&w=1200&q=80',
  },
  {
    name: 'Audio & Entertainment',
    description: 'Spatial audio, studio monitors, and immersive accessories tuned for fidelity.',
    slug: 'audio-entertainment',
    featured: false,
    accentColor: 'from-fuchsia-500 to-rose-500',
    image: 'https://images.unsplash.com/photo-1470223991234-a9422ac10454?auto=format&w=1200&q=80',
  },
  {
    name: 'Gaming & Performance',
    description: 'High-refresh displays, liquid-cooled rigs, and gear designed for domination.',
    slug: 'gaming-performance',
    featured: true,
    accentColor: 'from-violet-500 to-purple-700',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&w=1200&q=80',
  },
  {
    name: 'Smart Home',
    description: 'Secure hubs, sensors, and assistants that orchestrate the modern home.',
    slug: 'smart-home',
    featured: false,
    accentColor: 'from-emerald-500 to-green-600',
    image: 'https://images.unsplash.com/photo-1498661367879-c21f058b81b2?auto=format&w=1200&q=80',
  },
  {
    name: 'Accessories & Essentials',
    description: 'Chargers, docks, and everyday tech that keep premium devices powered.',
    slug: 'accessories-essentials',
    featured: false,
    accentColor: 'from-slate-500 to-gray-600',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&w=1200&q=80',
  },
  {
    name: 'Creator & Studio Gear',
    description: 'Reference displays, capture rigs, and input devices for content leaders.',
    slug: 'creator-gear',
    featured: true,
    accentColor: 'from-amber-500 to-orange-600',
    image: 'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&w=1200&q=80',
  },
]

const brandsData = [
  {
    name: 'AeroBook Labs',
    description: 'Precision-crafted ultrabooks engineered for endurance and silence.',
    slug: 'aerobook',
    logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&w=600&q=80',
    website: 'https://aerobook.example.com',
    primaryCategory: 'Laptops & Ultrabooks',
    featured: true,
  },
  {
    name: 'Lumina Mobile',
    description: 'Flagship smartphone experiences with cinematic imaging pipelines.',
    slug: 'lumina-mobile',
    logo: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&w=600&q=80',
    website: 'https://lumina.example.com',
    primaryCategory: 'Smartphones & Wearables',
    featured: true,
  },
  {
    name: 'PulseGear Audio',
    description: 'Spatial soundscapes and studio-grade monitoring for creators.',
    slug: 'pulsegear',
    logo: 'https://images.unsplash.com/photo-1475108791253-87523e02b533?auto=format&w=600&q=80',
    website: 'https://pulsegear.example.com',
    primaryCategory: 'Audio & Entertainment',
    featured: true,
  },
  {
    name: 'Vertex Performance',
    description: 'Thermally-optimized rigs and peripherals built for competitive gaming.',
    slug: 'vertex',
    logo: 'https://images.unsplash.com/photo-1527443224154-dc2b63e9eacf?auto=format&w=600&q=80',
    website: 'https://vertex.example.com',
    primaryCategory: 'Gaming & Performance',
    featured: true,
  },
  {
    name: 'Atlas Smart Living',
    description: 'Interconnected hubs, sensors, and ambient computing experiences.',
    slug: 'atlas',
    logo: 'https://images.unsplash.com/photo-1580894732930-41d0893e5be8?auto=format&w=600&q=80',
    website: 'https://atlas.example.com',
    primaryCategory: 'Smart Home',
    featured: false,
  },
  {
    name: 'Skyline Studio',
    description: 'Reference-grade creator gear tuned for film makers and sound designers.',
    slug: 'skyline',
    logo: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&w=600&q=80',
    website: 'https://skyline.example.com',
    primaryCategory: 'Creator & Studio Gear',
    featured: true,
  },
  {
    name: 'NanoCore Essentials',
    description: 'Travel chargers, GaN bricks, and rugged cables that outlast the day.',
    slug: 'nanocore',
    logo: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&w=600&q=80',
    website: 'https://nanocore.example.com',
    primaryCategory: 'Accessories & Essentials',
    featured: false,
  },
]

const productsData = [
  {
    name: 'AeroBook X15 Ultra',
    slug: 'aerobook-x15-ultra',
    sku: 'ABL-X15U',
    description:
      'Thin magnesium chassis, 15.6” OLED panel, and 18-hour battery life tuned for hybrid creators.',
    price: 1899.0,
    originalPrice: 2099.0,
    stock: 12,
    featured: true,
    categorySlug: 'laptops-ultrabooks',
    brandSlug: 'aerobook',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&w=1400&q=80',
        alt: 'AeroBook X15 Ultra open on a desk',
      },
      {
        url: 'https://images.unsplash.com/photo-1457305237443-44c3d5a30b89?auto=format&w=1400&q=80',
        alt: 'Side profile of AeroBook laptop',
      },
    ],
    features: ['Intel Evo certified', 'MagLev cooling', 'Wi-Fi 7 + 5G eSIM', 'Thunderbolt 5 dock-ready'],
    specifications: [
      { name: 'CPU', value: 'Intel Core Ultra 9 185H' },
      { name: 'GPU', value: 'NVIDIA RTX 4070 Studio 8GB' },
      { name: 'Display', value: '15.6” 4K OLED, 120Hz' },
      { name: 'Memory', value: '32GB LPDDR5X' },
      { name: 'Storage', value: '2TB NVMe Gen4 SSD' },
    ],
  },
  {
    name: 'AeroBook Air 13 Carbon',
    slug: 'aerobook-air-13-carbon',
    sku: 'ABL-AIR13',
    description:
      'Featherweight carbon fiber ultrabook with AI-powered battery optimizations for business travel.',
    price: 1399.0,
    originalPrice: 1499.0,
    stock: 24,
    featured: true,
    categorySlug: 'laptops-ultrabooks',
    brandSlug: 'aerobook',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&w=1400&q=80',
        alt: 'AeroBook Air 13 Carbon on a marble table',
      },
    ],
    features: ['Carbon fiber shell', 'Fingerprint unlock', '65W USB-C fast charge'],
    specifications: [
      { name: 'CPU', value: 'Intel Core Ultra 7 165H' },
      { name: 'Display', value: '13.5” 2.8K IPS, 500 nits' },
      { name: 'Memory', value: '16GB LPDDR5X' },
      { name: 'Storage', value: '1TB NVMe' },
      { name: 'Weight', value: '0.99 kg' },
    ],
  },
  {
    name: 'Lumina One Pro 5G',
    slug: 'lumina-one-pro',
    sku: 'LMN-ONEPRO',
    description:
      'Pro-grade imaging stack with triple 50MP sensors and computational RAW editing built-in.',
    price: 1199.0,
    originalPrice: 1299.0,
    stock: 40,
    featured: true,
    categorySlug: 'smartphones-wearables',
    brandSlug: 'lumina-mobile',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1510551313-0b8420cca02e?auto=format&w=1200&q=80',
        alt: 'Lumina One Pro smartphone close-up',
      },
    ],
    features: ['Triple 50MP sensors', '8K ProRes video', '120W HyperCharge', 'eSIM dual profile'],
    specifications: [
      { name: 'Chipset', value: 'Lumina X2 Neural ISP' },
      { name: 'Display', value: '6.8” LTPO AMOLED 1-120Hz' },
      { name: 'Battery', value: '5100mAh + 120W wired' },
      { name: 'Ingress', value: 'IP68 + IP69K' },
      { name: 'Modem', value: '5G mmWave + Sub6' },
    ],
  },
  {
    name: 'Lumina Fold Lite',
    slug: 'lumina-fold-lite',
    sku: 'LMN-FOLDL',
    description: 'Ultra-compact foldable with matte glass finish and stylus-ready inner display.',
    price: 1499.0,
    originalPrice: 1699.0,
    stock: 15,
    featured: false,
    categorySlug: 'tablets-2-in-1',
    brandSlug: 'lumina-mobile',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&w=1200&q=80',
        alt: 'Lumina foldable device partially open',
      },
    ],
    features: ['Ultra hinge with zero-gap', 'Nano-textured stylus glass', 'Dual batteries'],
    specifications: [
      { name: 'Display', value: '7.1” inner OLED + 3.4” cover' },
      { name: 'Memory', value: '12GB LPDDR5X' },
      { name: 'Storage', value: '512GB UFS 4.0' },
      { name: 'Stylus', value: 'Lumina Pen 2 support' },
      { name: 'Audio', value: 'Quad spatial speakers' },
    ],
  },
  {
    name: 'PulseGear SonicMax Studio',
    slug: 'pulsegear-sonicmax',
    sku: 'PLG-SMAX',
    description: 'Planar magnetic wireless headphones tuned for reference mixing and on-the-go.',
    price: 499.0,
    originalPrice: 599.0,
    stock: 35,
    featured: true,
    categorySlug: 'audio-entertainment',
    brandSlug: 'pulsegear',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1470223991234-a9422ac10454?auto=format&w=1200&q=80',
        alt: 'PulseGear SonicMax headphones on desk',
      },
    ],
    features: ['Planar magnetic drivers', 'Dual Bluetooth + balanced wired', 'Spatial HeadTracking'],
    specifications: [
      { name: 'Driver', value: '98mm planar magnetic' },
      { name: 'Battery', value: '45 hours ANC on' },
      { name: 'Latency', value: '28 ms gaming mode' },
      { name: 'Codecs', value: 'LDAC, aptX Lossless' },
      { name: 'Weight', value: '310 g' },
    ],
  },
  {
    name: 'Vertex Ignite 15 Mini-LED',
    slug: 'vertex-ignite-15',
    sku: 'VTX-IG15',
    description: 'Liquid metal cooled gaming laptop with 240Hz mini-LED HDR display.',
    price: 2399.0,
    originalPrice: 2499.0,
    stock: 9,
    featured: true,
    categorySlug: 'gaming-performance',
    brandSlug: 'vertex',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&w=1400&q=80',
        alt: 'Vertex Ignite gaming laptop',
      },
    ],
    features: ['Liquid metal cooling', 'Opto-mechanical keyboard', 'AI upscaling webcam'],
    specifications: [
      { name: 'CPU', value: 'AMD Ryzen 9 9955HX' },
      { name: 'GPU', value: 'NVIDIA RTX 4090 16GB' },
      { name: 'Display', value: '15.6” QHD+ mini-LED 240Hz' },
      { name: 'Memory', value: '64GB DDR5-6400' },
      { name: 'Storage', value: '2 x 2TB NVMe RAID' },
    ],
  },
  {
    name: 'Atlas Horizon Hub Max',
    slug: 'atlas-horizon-hub',
    sku: 'ATL-HUBMAX',
    description: 'Matter-ready smart home hub with onboard automation and thread border routing.',
    price: 349.0,
    originalPrice: 399.0,
    stock: 60,
    featured: false,
    categorySlug: 'smart-home',
    brandSlug: 'atlas',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&w=1200&q=80',
        alt: 'Atlas Horizon Hub on shelf',
      },
    ],
    features: ['Thread + Matter border router', 'Local ML automations', 'Encrypted remote access'],
    specifications: [
      { name: 'Connectivity', value: 'Wi-Fi 7, Thread, Zigbee, BLE 5.4' },
      { name: 'Storage', value: '128GB secure flash' },
      { name: 'Voice', value: 'Multilingual far-field array' },
      { name: 'Security', value: 'Hardware secure enclave' },
      { name: 'Integrations', value: '3,500+ devices' },
    ],
  },
  {
    name: 'Skyline Creator Pro 32" Reference',
    slug: 'skyline-creator-pro',
    sku: 'SKY-REF32',
    description: 'True 10-bit mini-LED mastering monitor calibrated for HDR10+ and Dolby Vision.',
    price: 2799.0,
    originalPrice: 2999.0,
    stock: 5,
    featured: true,
    categorySlug: 'creator-gear',
    brandSlug: 'skyline',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&w=1400&q=80',
        alt: 'Skyline Creator Pro monitor on editing desk',
      },
    ],
    features: ['2304-zone mini-LED', 'Delta E < 1', 'Dual Thunderbolt 4'],
    specifications: [
      { name: 'Resolution', value: '6K (6144 x 3456)' },
      { name: 'Color', value: 'P3 100%, Rec.2020 92%' },
      { name: 'Brightness', value: '1600 nits peak' },
      { name: 'Calibrations', value: 'Factory + 3D LUT slot' },
      { name: 'I/O', value: '2x TB4, 2x HDMI 2.1, SD Express' },
    ],
  },
  {
    name: 'NanoCore GaN Travel Dock',
    slug: 'nanocore-gan-dock',
    sku: 'NNC-GAN130',
    description: '130W GaN travel dock with integrated SSD bay and dual 4K60 display output.',
    price: 199.0,
    originalPrice: 229.0,
    stock: 120,
    featured: false,
    categorySlug: 'accessories-essentials',
    brandSlug: 'nanocore',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&w=1200&q=80',
        alt: 'NanoCore GaN dock with cables',
      },
    ],
    features: ['130W GaN charging', 'NVMe SSD enclosure', 'Dual HDMI 2.0'],
    specifications: [
      { name: 'Power Delivery', value: '100W USB-C + 30W USB-A' },
      { name: 'USB Ports', value: '2 x USB4, 2 x USB-A 10Gbps' },
      { name: 'Video', value: 'Dual 4K60 or single 8K' },
      { name: 'Storage', value: 'Tool-less M.2 bay' },
      { name: 'Weight', value: '210 g' },
    ],
  },
]

const couponsData = [
  {
    code: 'LAUNCH10',
    name: 'Launch Celebration',
    description: 'Take 10% off premium devices above $1,000.',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: 1000,
    maxDiscount: 300,
    usageLimit: 100,
    userUsageLimit: 2,
  },
  {
    code: 'PROSHIP',
    name: 'Pro Shipping Upgrade',
    description: 'Complimentary express shipping on creator gear.',
    type: 'FREE_SHIPPING',
    value: 0,
    minOrderAmount: 0,
    usageLimit: 200,
    userUsageLimit: 5,
  },
]

async function resetDatabase() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.review.deleteMany(),
    prisma.stockAlert.deleteMany(),
    prisma.userCoupon.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.newsletterSubscription.deleteMany(),
    prisma.address.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productSpecification.deleteMany(),
    prisma.productFeature.deleteMany(),
    prisma.product.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.category.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ])
}

async function main() {
  console.log('🌱 Resetting database…')
  await resetDatabase()

  console.log('🗂  Creating categories and brands…')
  const categoryMap = {}
  for (const category of categoriesData) {
    const record = await prisma.category.create({ data: category })
    categoryMap[category.slug] = record
  }

  const brandMap = {}
  for (const brand of brandsData) {
    const record = await prisma.brand.create({ data: brand })
    brandMap[brand.slug] = record
  }

  console.log('🧾 Inserting catalog…')
  const productMap = {}
  for (const product of productsData) {
    const record = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        featured: product.featured,
        categoryId: categoryMap[product.categorySlug].id,
        brandId: brandMap[product.brandSlug].id,
        images: {
          create: product.images.map((image, index) => ({
            url: image.url,
            alt: image.alt,
            isPrimary: index === 0,
            order: index,
          })),
        },
        features: {
          create: product.features.map((feature) => ({ name: feature })),
        },
        specifications: {
          create: product.specifications,
        },
      },
    })
    productMap[product.slug] = record
  }

  console.log('👤 Creating preview user accounts…')
  const adminPassword = await bcrypt.hash('admin123', 12)
  const clientPassword = await bcrypt.hash('client123', 12)
  const proPassword = await bcrypt.hash('shopper123', 12)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@dilitechsolutions.com',
      name: 'Sarah Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@dilitechsolutions.com',
      name: 'John Customer',
      password: clientPassword,
      role: 'USER',
      phone: '+254700000001',
    },
  })

  const creatorUser = await prisma.user.create({
    data: {
      email: 'ava@skyline.studio',
      name: 'Ava Creative',
      password: proPassword,
      role: 'USER',
      phone: '+254799123456',
    },
  })

  console.log('🏠 Adding saved addresses…')
  const clientAddress = await prisma.address.create({
    data: {
      type: 'SHIPPING',
      firstName: 'John',
      lastName: 'Customer',
      address1: '18 Riverside Drive',
      address2: 'Suite 402',
      city: 'Nairobi',
      state: 'Nairobi County',
      postalCode: '00100',
      country: 'Kenya',
      phone: clientUser.phone,
      isDefault: true,
      userId: clientUser.id,
    },
  })

  const creatorAddress = await prisma.address.create({
    data: {
      type: 'SHIPPING',
      firstName: 'Ava',
      lastName: 'Creative',
      address1: '712 Crescent Lane',
      city: 'Westlands',
      state: 'Nairobi County',
      postalCode: '00800',
      country: 'Kenya',
      phone: creatorUser.phone,
      isDefault: true,
      userId: creatorUser.id,
    },
  })

  console.log('🎟  Creating coupons…')
  const couponRecords = {}
  for (const coupon of couponsData) {
    const record = await prisma.coupon.create({
      data: {
        ...coupon,
        code: coupon.code.toUpperCase(),
        status: 'ACTIVE',
      },
    })
    couponRecords[coupon.code] = record
  }

  console.log('🛒 Drafting carts, wishlists, and reviews…')
  await prisma.cartItem.create({
    data: {
      userId: creatorUser.id,
      productId: productMap['lumina-one-pro'].id,
      quantity: 1,
    },
  })

  await prisma.wishlistItem.create({
    data: {
      userId: clientUser.id,
      productId: productMap['skyline-creator-pro'].id,
    },
  })

  await prisma.review.create({
    data: {
      rating: 5,
      title: 'Battery that finally matches my travel days',
      content:
        'Used the AeroBook X15 Ultra for three back-to-back edits and never reached for the charger.',
      productId: productMap['aerobook-x15-ultra'].id,
      userId: clientUser.id,
      verified: true,
    },
  })

  await prisma.review.create({
    data: {
      rating: 4,
      title: 'Color accuracy is unreal',
      content:
        'The Skyline Creator Pro replaced my dual-monitor grading setup. Fanless and silent even at 1600 nits.',
      productId: productMap['skyline-creator-pro'].id,
      userId: creatorUser.id,
      verified: true,
    },
  })

  console.log('📦 Creating sample orders…')
  await prisma.order.create({
    data: {
      orderNumber: 'FH-240001',
      userId: clientUser.id,
      status: 'DELIVERED',
      paymentStatus: 'COMPLETED',
      paymentMethod: 'stripe',
      paymentReference: 'stripe_pi_240001',
      stripePaymentIntentId: 'pi_3RdemoAeroBook',
      trackingNumber: 'FH-TRACK-240001',
      carrier: 'Skyline Priority',
      deliveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      subtotal: 2398.0,
      shipping: 25.0,
      tax: 120.0,
      discount: 239.8,
      total: 2303.2,
      couponId: couponRecords['LAUNCH10'].id,
      shippingAddressId: clientAddress.id,
      items: {
        create: [
          {
            quantity: 1,
            price: new Prisma.Decimal(1899.0),
            productId: productMap['aerobook-x15-ultra'].id,
          },
          {
            quantity: 1,
            price: new Prisma.Decimal(499.0),
            productId: productMap['pulsegear-sonicmax'].id,
          },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'FH-240145',
      userId: creatorUser.id,
      status: 'PROCESSING',
      paymentStatus: 'PENDING',
      paymentMethod: 'mpesa',
      paymentReference: 'mpesa_checkout_240145',
      trackingNumber: null,
      carrier: null,
      subtotal: 2998.0,
      shipping: 0,
      tax: 0,
      discount: 0,
      total: 2998.0,
      shippingAddressId: creatorAddress.id,
      items: {
        create: [
          {
            quantity: 1,
            price: new Prisma.Decimal(1499.0),
            productId: productMap['lumina-fold-lite'].id,
          },
          {
            quantity: 1,
            price: new Prisma.Decimal(1499.0),
            productId: productMap['skyline-creator-pro'].id,
          },
        ],
      },
    },
  })

  console.log('📮 Newsletter & alerts…')
  await prisma.newsletterSubscription.create({
    data: {
      email: 'futurebuyer@inbox.com',
      name: 'Future Buyer',
      isActive: true,
    },
  })

  await prisma.stockAlert.create({
    data: {
      productId: productMap['vertex-ignite-15'].id,
      userId: creatorUser.id,
      threshold: 5,
    },
  })

  await prisma.userCoupon.create({
    data: {
      userId: clientUser.id,
      couponId: couponRecords['LAUNCH10'].id,
      usageCount: 1,
    },
  })

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
