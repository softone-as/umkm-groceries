import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);

export async function runSeed(): Promise<void> {
  console.log('Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed store_settings (singleton)
    console.log('Seeding store_settings...');
    await client.query(`
      INSERT INTO store_settings (
        id, shop_name, address, pickup_hours, whatsapp_number, bank_instructions, updated_at
      ) VALUES (
        1,
        'Toko Sembako Berkah Santo',
        'Jl. Raya Kebon Jeruk No. 88, Jakarta Barat',
        'Senin - Sabtu: 08:00 - 17:00 WIB',
        '6281234567890',
        'Bank BCA: 1234567890 a.n. Toko Sembako Berkah Santo',
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        shop_name = EXCLUDED.shop_name,
        address = EXCLUDED.address,
        pickup_hours = EXCLUDED.pickup_hours,
        whatsapp_number = EXCLUDED.whatsapp_number,
        bank_instructions = EXCLUDED.bank_instructions,
        updated_at = NOW();
    `);

    // 2. Seed initial staff user (admin)
    console.log('Seeding initial staff_users...');
    const defaultPassword = 'adminpassword123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await client.query(`
      INSERT INTO staff_users (
        username, password_hash, role, is_active
      ) VALUES (
        'admin',
        $1,
        'admin',
        true
      )
      ON CONFLICT (username) DO NOTHING;
    `, [passwordHash]);

    // 3. Seed initial sembako catalog and inventory
    console.log('Seeding initial products & inventory...');
    const sampleProducts = [
      {
        name: 'Beras Rojolele Super 5kg',
        category: 'Beras',
        selling_unit: 'karung',
        price_idr: 72000,
        image_url: '/uploads/images/beras-rojolele.webp',
        on_hand: 25,
      },
      {
        name: 'Minyak Goreng Bimoli 2L',
        category: 'Minyak Goreng',
        selling_unit: 'pouch',
        price_idr: 38500,
        image_url: '/uploads/images/minyak-bimoli.webp',
        on_hand: 40,
      },
      {
        name: 'Gula Pasir Gulaku Putih 1kg',
        category: 'Gula Pasir',
        selling_unit: 'kg',
        price_idr: 17500,
        image_url: '/uploads/images/gulaku-putih.webp',
        on_hand: 50,
      },
      {
        name: 'Telur Ayam Negeri Segar 1kg',
        category: 'Telur Ayam',
        selling_unit: 'kg',
        price_idr: 28000,
        image_url: '/uploads/images/telur-ayam.webp',
        on_hand: 30,
      },
      {
        name: 'Tepung Terigu Segitiga Biru 1kg',
        category: 'Tepung Terigu',
        selling_unit: 'kg',
        price_idr: 13000,
        image_url: '/uploads/images/segitiga-biru.webp',
        on_hand: 35,
      },
      {
        name: 'Bumbu Racik Indofood Ayam Goreng',
        category: 'Bumbu Dapur',
        selling_unit: 'bungkus',
        price_idr: 2500,
        image_url: '/uploads/images/racik-ayam.webp',
        on_hand: 100,
      },
      {
        name: 'Indomie Mi Goreng Spesial 85g',
        category: 'Mie & Pasta',
        selling_unit: 'bungkus',
        price_idr: 3100,
        image_url: '/uploads/images/indomie-goreng.webp',
        on_hand: 200,
      },
    ];

    for (const p of sampleProducts) {
      // Check if exists by name
      const existing = await client.query<{ id: string }>(
        'SELECT id FROM products WHERE name = $1',
        [p.name],
      );

      let productId: string;
      if (existing.rows.length === 0) {
        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO products (name, category, selling_unit, price_idr, image_url, is_active)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id`,
          [p.name, p.category, p.selling_unit, p.price_idr, p.image_url],
        );
        productId = insertRes.rows[0]!.id;

        await client.query(
          `INSERT INTO inventory (product_id, on_hand, reserved)
           VALUES ($1, $2, 0)`,
          [productId, p.on_hand],
        );
      } else {
        productId = existing.rows[0]!.id;
        await client.query(
          `INSERT INTO inventory (product_id, on_hand, reserved)
           VALUES ($1, $2, 0)
           ON CONFLICT (product_id) DO UPDATE SET on_hand = EXCLUDED.on_hand`,
          [productId, p.on_hand],
        );
      }
    }

    await client.query('COMMIT');
    console.log('✓ Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  try {
    await runSeed();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === __filename) {
  void main();
}
