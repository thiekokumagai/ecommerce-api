import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productItemOption.deleteMany({});
  await prisma.productItem.deleteMany({});
  await prisma.productVariation.deleteMany({});
  await prisma.variationOption.deleteMany({});
  await prisma.variation.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('Dados anteriores limpos com sucesso.');

  // 2. Criar Admin Default
  const password = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: { password },
    create: {
      name: 'Admin',
      email: 'admin@admin.com',
      password,
      role: 'ADMIN',
    },
  });
  console.log('Admin criado:', admin.email);

}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
