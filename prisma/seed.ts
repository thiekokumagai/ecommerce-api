import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Limpar dados antigos para permitir sementes limpas
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

  // 3. Criar Categorias
  const catPods = await prisma.category.create({
    data: { title: 'Pods Descartáveis', isVisible: true, order: 1 },
  });
  const catAcc = await prisma.category.create({
    data: { title: 'Acessórios', isVisible: true, order: 2 },
  });
  console.log('Categorias criadas.');

  // 4. Criar Variações e Opções
  const varSabor = await prisma.variation.create({
    data: { title: 'Sabor' },
  });
  const optGrape = await prisma.variationOption.create({
    data: { value: 'Grape Ice', variationId: varSabor.id, order: 1 },
  });
  const optWatermelon = await prisma.variationOption.create({
    data: { value: 'Watermelon Ice', variationId: varSabor.id, order: 2 },
  });
  console.log('Variações criadas.');

  // 5. Criar Produtos
  // Produto 1: Ignite V80 (Com Variação de Sabor)
  const prodIgnite = await prisma.product.create({
    data: {
      title: 'Ignite V80 10000 Puffs',
      categoryId: catPods.id,
      price: 89.90,
      promotionalPrice: 76.41,
      costPrice: 40.00,
      description: 'Pod descartável Ignite V80 com 10000 puffs. Bateria recarregável via USB-C.',
    },
  });

  // Associar variação Sabor ao produto Ignite
  await prisma.productVariation.create({
    data: {
      productId: prodIgnite.id,
      variationId: varSabor.id,
    },
  });

  // Criar itens físicos de estoque para Ignite (Grape Ice e Watermelon Ice)
  const itemIgniteGrape = await prisma.productItem.create({
    data: {
      productId: prodIgnite.id,
      stock: 25,
      sku: 'IGN-V80-GRAPE',
      hash: optGrape.id, // O hash mapeia a opção selecionada
      options: {
        create: {
          optionId: optGrape.id,
        },
      },
    },
  });

  const itemIgniteWatermelon = await prisma.productItem.create({
    data: {
      productId: prodIgnite.id,
      stock: 15,
      sku: 'IGN-V80-WMELON',
      hash: optWatermelon.id,
      options: {
        create: {
          optionId: optWatermelon.id,
        },
      },
    },
  });

  // Produto 2: Carregador USB-C Magnético (Simples, Sem variação)
  const prodCharger = await prisma.product.create({
    data: {
      title: 'Carregador USB-C Magnético',
      categoryId: catAcc.id,
      price: 29.90,
      costPrice: 10.00,
      description: 'Carregador USB-C magnético universal para pods recarregáveis.',
    },
  });

  // Item de estoque para produto simples (hash vazio)
  const itemCharger = await prisma.productItem.create({
    data: {
      productId: prodCharger.id,
      stock: 30,
      sku: 'ACC-USBC-MAG',
      hash: '',
    },
  });

  console.log('Produtos e Estoque inicial cadastrados com sucesso.');

  // 6. Criar Pedidos Reais conectados
  const order1 = await prisma.order.create({
    data: {
      customerName: 'João Silva',
      customerPhone: '(67) 99999-1234',
      itemsTotal: 182.72,
      freight: 8.00,
      discount: 0.00,
      totalOrder: 190.72,
      totalReceived: 190.72,
      paymentType: 'Online',
      paymentMethod: 'PIX',
      street: 'Rua 14 de Julho',
      number: '2345',
      neighborhood: 'Centro',
      city: 'Campo Grande',
      state: 'MS',
      cep: '79002-000',
      status: 'PENDING',
      items: {
        create: [
          {
            productId: prodIgnite.id,
            productItemId: itemIgniteGrape.id,
            productName: 'Ignite V80 10000 Puffs',
            price: 76.41,
            quantity: 2,
            variation: 'Grape Ice',
          },
          {
            productId: prodCharger.id,
            productItemId: itemCharger.id,
            productName: 'Carregador USB-C Magnético',
            price: 29.90,
            quantity: 1,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      customerName: 'Maria Santos',
      customerPhone: '(67) 99888-5678',
      itemsTotal: 76.41,
      freight: 5.00,
      discount: 10.00,
      totalOrder: 71.41,
      totalReceived: 0.00,
      paymentType: 'Presencial',
      paymentMethod: 'Cartão de Crédito',
      street: 'Av. Afonso Pena',
      number: '1234',
      neighborhood: 'Centro',
      city: 'Campo Grande',
      state: 'MS',
      cep: '79002-001',
      status: 'CONFIRMED',
      items: {
        create: [
          {
            productId: prodIgnite.id,
            productItemId: itemIgniteWatermelon.id,
            productName: 'Ignite V80 10000 Puffs',
            price: 76.41,
            quantity: 1,
            variation: 'Watermelon Ice',
          },
        ],
      },
    },
  });

  console.log('Pedidos de exemplo criados e conectados.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
