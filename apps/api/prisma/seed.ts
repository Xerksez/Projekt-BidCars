import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.auction.createMany({
    data: [
      {
        title: 'Ford Mustang GT',
        vin: '1FA6P8CF1F1234567',
        startsAt: new Date('2025-08-26T10:00:00.000Z'),
        endsAt: new Date('2025-08-27T10:00:00.000Z'),
        currentPrice: 12000,
      },
      {
        title: 'BMW 335i',
        vin: 'WBA3A9G55DNP12345',
        startsAt: new Date('2025-08-28T12:00:00.000Z'),
        endsAt: new Date('2025-08-29T12:00:00.000Z'),
        currentPrice: 8000,
      },
      {
        title: 'Toyota Camry SE',
        vin: '4T1BF1FK5FU123456',
        startsAt: new Date('2025-08-30T08:00:00.000Z'),
        endsAt: new Date('2025-08-31T08:00:00.000Z'),
        currentPrice: 6000,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => {
    console.log('✅ Seed completed');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
