import { PrismaClient } from '@prisma/client';
import * as Minio from 'minio';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const prisma = new PrismaClient();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT as string,
  port: Number(process.env.MINIO_PORT),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY as string,
  secretKey: process.env.MINIO_SECRET_KEY as string,
});

const bucket = 'podemaismidia';

const categories = [
    {
        "id": "6552781b7c42ac0524220abd",
        "nome": "Descartável",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/2162ac30f3332cefb38231f23b12d46f.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 62,
        "filhas": []
    },
    {
        "id": "67601f980618050de66b2a8f",
        "nome": "Life Pod",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/8c957d8d055efd110b498bcc8e12214e.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 24,
        "filhas": []
    },
    {
        "id": "654a682ce2c80e1434423b65",
        "nome": "NicSalt",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/0a5bc714e465aea4a3e5dc8a49d20590.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 79,
        "filhas": []
    },
    {
        "id": "65527760f4e59c23f0711e16",
        "nome": "Resistência",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/a5cb978691de9ea42306d6189c69c4b1.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 41,
        "filhas": []
    },
    {
        "id": "6552781177a82151d965b54d",
        "nome": "Juice",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/956fa675fed74ae658118e020d310f4d.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 30,
        "filhas": []
    },
    {
        "id": "6552782494f3d8089b660b31",
        "nome": "Pod System",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/6acd4784b6144a68088d74b3d8842326.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 15,
        "filhas": []
    },
    {
        "id": "65527b4cd807ff79475e94bb",
        "nome": "Acessórios ",
        "codigo": null,
        "imagem": "https://cdn.vendizap.com/vendizap-categorias/d2cec8d54b066844cb6e72f63645eab8.webp",
        "pai": null,
        "profundidade": 0,
        "produtosAtivos": 6,
        "filhas": []
    }
];

async function downloadAndUploadImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar imagem: ${url}`);
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Redimensiona usando o mesmo padrão do seu CategoriesController
  const croppedBuffer = await sharp(buffer)
    .resize(92, 92, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 90 })
    .toBuffer();

  const fileName = `categories/${randomUUID()}.webp`;

  await minioClient.putObject(bucket, fileName, croppedBuffer, croppedBuffer.length, {
    'Content-Type': 'image/webp',
  });

  return fileName;
}

async function main() {
  console.log('Iniciando re-importação de categorias baixando as imagens...');
  
  for (const cat of categories) {
    try {
      let finalImageName = cat.imagem;
      if (cat.imagem && cat.imagem.startsWith('http')) {
        console.log(`Baixando imagem para '${cat.nome}'...`);
        finalImageName = await downloadAndUploadImage(cat.imagem);
      }

      const upserted = await prisma.category.upsert({
        where: { externalId: cat.id },
        update: {
          title: cat.nome,
          image: finalImageName,
        },
        create: {
          externalId: cat.id,
          title: cat.nome,
          image: finalImageName,
        }
      });
      console.log(`Categoria '${upserted.title}' finalizada com imagem própria: ${finalImageName}`);
    } catch (error) {
      console.error(`Erro ao importar categoria ${cat.nome}:`, error);
    }
  }
  
  console.log('Importação com imagens finalizada!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
