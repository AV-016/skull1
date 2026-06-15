import { Product } from './types'

export interface ExtendedProduct extends Product {
  rating: number
  reviewsCount: number
  isNew?: boolean
}

export const mockProducts: ExtendedProduct[] = [
  {
    id: 'prod_1',
    slug: 'shogun-cyber-oni-figure',
    name: 'Shogun Cyber-Oni Figure',
    description: 'A premium, hand-detailed 3D printed mechanical demon figure. Featuring intricate armor panels, modular display weapons, and a custom futuristic display base.',
    price: 4999,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'
    ],
    category: 'Anime Figures',
    specifications: {
      'Material': 'High-Detail Tough Resin',
      'Height': '18cm',
      'Layer Height': '0.05mm',
      'Finish': 'Semi-Gloss Primer Gray'
    },
    featured: true,
    rating: 4.9,
    reviewsCount: 48,
    isNew: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    slug: 'fractal-kinetic-sculpture',
    name: 'Fractal Kinetic Sculpture',
    description: 'An elegant desk companion that moves in mesmerizing patterns. Mathematical geometry brought to life using ultra-low-friction pivot bearings.',
    price: 1899,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'],
    category: 'Desk Accessories',
    specifications: {
      'Material': 'PLA Pro Composite',
      'Dimensions': '12cm x 12cm x 12cm',
      'Layer Height': '0.12mm',
      'Bearings': 'R188 Stainless Steel'
    },
    featured: true,
    rating: 4.8,
    reviewsCount: 32,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    slug: 'cyberpunk-artisan-keycaps',
    name: 'Cyberpunk Artisan Keycaps',
    description: 'Custom 3D printed resin keycaps for mechanical keyboards. Translucent glowing visor details allow LED backlighting to shine through beautifully.',
    price: 1299,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&auto=format&fit=crop&q=80'],
    category: 'Custom Designs',
    specifications: {
      'Material': 'Photopolymer Tough Resin',
      'Key Profile': 'Cherry MX / OEM Compatible',
      'Layer Height': '0.025mm'
    },
    featured: true,
    rating: 4.7,
    reviewsCount: 19,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    slug: 'articulated-crystal-dragon',
    name: 'Articulated Crystal Dragon',
    description: 'Fully jointed, highly flexible crystal dragon printed as a single piece. Features color-shifting silk filament that sparkles under changing light.',
    price: 1499,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80'],
    category: 'Miniatures',
    specifications: {
      'Material': 'Premium Silk PLA',
      'Length': '45cm',
      'Articulations': '22 Independent Joints'
    },
    featured: true,
    rating: 4.9,
    reviewsCount: 65,
    isNew: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    slug: 'parametric-origami-vase',
    name: 'Parametric Origami Vase',
    description: 'Stunning mathematical flower vase. Its complex folded structure creates subtle ambient shadows that accent modern minimalist interiors.',
    price: 2299,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80'],
    category: 'Home Decor',
    specifications: {
      'Material': 'Recycled PETG',
      'Height': '24cm',
      'Waterproof': '100% Watertight Tested'
    },
    featured: true,
    rating: 4.8,
    reviewsCount: 28,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_6',
    slug: 'v8-engine-assembly-model',
    name: 'V8 Engine Assembly Model',
    description: 'A working educational piston assembly model. See pistons fire and gears engage with high-precision components printed to exact tolerances.',
    price: 5999,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'],
    category: 'Engineering Models',
    specifications: {
      'Material': 'Industrial ABS & Carbon Fiber Nylon',
      'Parts Count': '54 Interlocking Pieces',
      'Tolerance': '±0.1mm'
    },
    featured: false,
    rating: 4.9,
    reviewsCount: 14,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_7',
    slug: 'magnetic-helix-organizer',
    name: 'Magnetic Helix Organizer',
    description: 'A double-helix pen and tool dock with integrated high-strength neodymium magnets to snap paperclips and metal tools in place.',
    price: 999,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=80'],
    category: 'Desk Accessories',
    specifications: {
      'Material': 'PLA Matte Matte Black',
      'Capacity': '12 Stylus Slots',
      'Magnets': '4x N52 Neodymium'
    },
    featured: false,
    rating: 4.6,
    reviewsCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_8',
    slug: 'steampunk-gear-keychain',
    name: 'Steampunk Gear Keychain',
    description: 'Real working planetary gears on your key ring. A pocket-sized mechanical fidget toy that operates with smooth micro-mesh design.',
    price: 499,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80'],
    category: 'Keychains',
    specifications: {
      'Material': 'Engineering Nylon PA12',
      'Diameter': '4.5cm',
      'Weight': '14g'
    },
    featured: false,
    rating: 4.7,
    reviewsCount: 104,
    isNew: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_9',
    slug: 'gothic-gargoyle-miniature',
    name: 'Gothic Gargoyle Miniature',
    description: 'Intricately sculpted gargoyle figure for tabletop gaming or painting enthusiasts, featuring sharp texture detail and slate stone base.',
    price: 799,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&auto=format&fit=crop&q=80'],
    category: 'Miniatures',
    specifications: {
      'Material': 'High-Definition SLA Resin',
      'Scale': '28mm Heroic Gaming Scale',
      'Layer Height': '0.03mm'
    },
    featured: false,
    rating: 4.8,
    reviewsCount: 23,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_10',
    slug: 'low-poly-wolf-sculpture',
    name: 'Low-Poly Wolf Sculpture',
    description: 'Abstract geometric wolf sculpture. Perfect clean facets and sharp lines make a bold modern statement piece for any sideboard or shelf.',
    price: 1599,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1535262412277-26ec02b49985?w=800&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1535262412277-26ec02b49985?w=800&auto=format&fit=crop&q=80'],
    category: 'Home Decor',
    specifications: {
      'Material': 'Premium Matte PLA',
      'Dimensions': '20cm x 8cm x 15cm',
      'Weight': '210g'
    },
    featured: false,
    rating: 4.8,
    reviewsCount: 37,
    createdAt: new Date().toISOString()
  }
]

export const sanitizeProducts = (products: Product[]): ExtendedProduct[] => {
  if (!products || products.length === 0) {
    return mockProducts
  }

  return products.map((prod) => {
    const primaryImg = (prod as any).image ||
      (prod.images as any)?.find((img: any) => img.isPrimary)?.url ||
      (prod.images as any)?.[0]?.url ||
      '/placeholder.jpg';

    const imageUrls = prod.images && Array.isArray(prod.images)
      ? prod.images.map((img: any) => typeof img === 'string' ? img : img.url)
      : [];

    const variants = (prod as any).variants && Array.isArray((prod as any).variants)
      ? (prod as any).variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          stock: v.stock,
          images: v.images && Array.isArray(v.images)
            ? v.images.map((vi: any) => typeof vi === 'string' ? vi : vi.url)
            : []
        }))
      : [];

    const mockProduct = mockProducts.find((mp) => mp.slug === prod.slug)
    if (mockProduct) {
      return {
        ...mockProduct,
        ...prod,
        image: primaryImg,
        images: imageUrls.length > 0 ? imageUrls : mockProduct.images,
        variants: variants.length > 0 ? variants : (mockProduct.variants || []),
        featured: (prod as any).isFeatured ?? mockProduct.featured,
        rating: (prod as any).rating !== undefined ? (prod as any).rating : 0,
        reviewsCount: (prod as any).reviewsCount !== undefined ? (prod as any).reviewsCount : 0,
        isNew: mockProduct.isNew
      }
    }

    let catName = ''
    if (prod.category) {
      if (typeof prod.category === 'object' && (prod.category as any).name) {
        catName = (prod.category as any).name
      } else if (typeof prod.category === 'string') {
        catName = prod.category
      }
    }

    return {
      ...prod,
      image: primaryImg,
      images: imageUrls.length > 0 ? imageUrls : [primaryImg],
      variants,
      featured: (prod as any).isFeatured ?? (prod as any).featured ?? false,
      category: catName,
      rating: (prod as any).rating !== undefined ? (prod as any).rating : 0,
      reviewsCount: (prod as any).reviewsCount !== undefined ? (prod as any).reviewsCount : 0
    }
  })
}
