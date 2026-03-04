import 'reflect-metadata';
import { AppDataSource } from '../config/datasource.config';

const categories = [
  { name: 'Elektronik', slug: 'elektronik' },
  { name: 'Giyim', slug: 'giyim' },
  { name: 'Kitap', slug: 'kitap' },
  { name: 'Spor', slug: 'spor' },
  { name: 'Ev & Yaşam', slug: 'ev-yasam' },
  { name: 'Kozmetik', slug: 'kozmetik' },
];

const productsByCategorySlug: Record<
  string,
  { name: string; description: string; price: number; stock: number; imageUrl: string }[]
> = {
  elektronik: [
    {
      name: 'iPhone 15 Pro Max',
      description: '6.7 inç Super Retina XDR ekran, A17 Pro çip, 256GB depolama',
      price: 89999,
      stock: 15,
      imageUrl: 'https://placehold.co/400x400?text=iPhone+15+Pro',
    },
    {
      name: 'Samsung 4K QLED TV 55"',
      description: '55 inç 4K QLED panel, HDR10+, Smart TV, 120Hz',
      price: 24999,
      stock: 8,
      imageUrl: 'https://placehold.co/400x400?text=Samsung+TV',
    },
    {
      name: 'Sony WH-1000XM5',
      description: 'Gürültü engelleme kulaklık, 30 saat pil ömrü, LDAC desteği',
      price: 6999,
      stock: 25,
      imageUrl: 'https://placehold.co/400x400?text=Sony+WH1000XM5',
    },
  ],
  giyim: [
    {
      name: 'Nike Air Max 270',
      description: 'Erkek koşu ayakkabısı, Air Max yastıklama, 270° görünür hava birimi',
      price: 3499,
      stock: 40,
      imageUrl: 'https://placehold.co/400x400?text=Nike+Air+Max',
    },
    {
      name: "Levi's 501 Slim Fit Jeans",
      description: 'Klasik slim fit denim pantolon, %100 pamuk, koyu mavi',
      price: 1299,
      stock: 60,
      imageUrl: 'https://placehold.co/400x400?text=Levis+501',
    },
    {
      name: 'Zara Oversize Hoodie',
      description: 'Unisex oversize kapüşonlu sweatshirt, %80 pamuk %20 polyester',
      price: 799,
      stock: 45,
      imageUrl: 'https://placehold.co/400x400?text=Zara+Hoodie',
    },
  ],
  kitap: [
    {
      name: 'Atomic Habits',
      description: 'James Clear — Küçük değişikliklerle büyük sonuçlar almanın kanıtlanmış yolu',
      price: 185,
      stock: 100,
      imageUrl: 'https://placehold.co/400x400?text=Atomic+Habits',
    },
    {
      name: 'Dune',
      description: 'Frank Herbert — Bilimkurgunun başyapıtı, 6 kitaplık destanın ilk cildi',
      price: 210,
      stock: 75,
      imageUrl: 'https://placehold.co/400x400?text=Dune',
    },
    {
      name: 'Clean Code',
      description: 'Robert C. Martin — Çevik yazılım ustalığı el kitabı',
      price: 320,
      stock: 50,
      imageUrl: 'https://placehold.co/400x400?text=Clean+Code',
    },
  ],
  spor: [
    {
      name: 'Decathlon Yoga Matı',
      description: 'Anti-slip 6mm TPE yoga matı, 183x61cm, taşıma askılı',
      price: 349,
      stock: 80,
      imageUrl: 'https://placehold.co/400x400?text=Yoga+Mat',
    },
    {
      name: 'Wilson Pro Staff Tenis Raketi',
      description: '97 kafa, 315gr, karbon fiber gövde, kontrol odaklı',
      price: 2499,
      stock: 20,
      imageUrl: 'https://placehold.co/400x400?text=Wilson+Tennis',
    },
    {
      name: 'Garmin Forerunner 265',
      description: 'GPS koşu saati, AMOLED ekran, kalp atış monitörü, 13 gün pil',
      price: 8999,
      stock: 12,
      imageUrl: 'https://placehold.co/400x400?text=Garmin+265',
    },
  ],
  'ev-yasam': [
    {
      name: 'Philips Airfryer XXL',
      description: '7.3L kapasite, Rapid Air teknolojisi, 7 programa hazır',
      price: 4499,
      stock: 18,
      imageUrl: 'https://placehold.co/400x400?text=Philips+Airfryer',
    },
    {
      name: 'IKEA KALLAX Raf Ünitesi',
      description: '4 bölmeli raf, beyaz, 77x77cm, modüler tasarım',
      price: 1299,
      stock: 30,
      imageUrl: 'https://placehold.co/400x400?text=IKEA+Kallax',
    },
    {
      name: 'Dyson V15 Detect',
      description: 'Lazer toz algılama teknolojili kablosuz süpürge, 60 dk çalışma süresi',
      price: 18999,
      stock: 10,
      imageUrl: 'https://placehold.co/400x400?text=Dyson+V15',
    },
  ],
  kozmetik: [
    {
      name: "L'Oréal Paris Revitalift Serum",
      description: '%1.5 saf hiyalüronik asit, 24 saat nem, 30ml',
      price: 449,
      stock: 55,
      imageUrl: 'https://placehold.co/400x400?text=LOreal+Serum',
    },
    {
      name: 'Cerave Nemlendirici Krem',
      description: 'Tüm cilt tipleri için, seramid ve hiyalüronik asit içerikli, 473ml',
      price: 599,
      stock: 70,
      imageUrl: 'https://placehold.co/400x400?text=Cerave+Cream',
    },
    {
      name: 'The Ordinary Niacinamide %10',
      description: 'Niacinamide %10 + Çinko %1 yüz serumu, gözenek küçültücü, 30ml',
      price: 279,
      stock: 90,
      imageUrl: 'https://placehold.co/400x400?text=The+Ordinary',
    },
  ],
};

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected.');

  // Clean existing data (order matters due to FK constraints)
  await AppDataSource.query('DELETE FROM order_items');
  await AppDataSource.query('DELETE FROM orders');
  await AppDataSource.query('DELETE FROM products');
  await AppDataSource.query('DELETE FROM categories');
  console.log('Existing data cleared.');

  // Insert categories
  const categoryEntities: { id: string; slug: string }[] = [];
  for (const cat of categories) {
    const result = await AppDataSource.query(
      `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, slug`,
      [cat.name, cat.slug],
    );
    categoryEntities.push(result[0]);
    console.log(`  Category created: ${cat.name}`);
  }

  // Insert products
  let productCount = 0;
  for (const catEntity of categoryEntities) {
    const products = productsByCategorySlug[catEntity.slug];
    if (!products) continue;

    for (const p of products) {
      await AppDataSource.query(
        `INSERT INTO products (name, description, price, stock, "imageUrl", "categoryId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [p.name, p.description, p.price, p.stock, p.imageUrl, catEntity.id],
      );
      productCount++;
      console.log(`  Product created: ${p.name}`);
    }
  }

  console.log(`\nSeed tamamlandı: ${categories.length} kategori, ${productCount} ürün eklendi.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
