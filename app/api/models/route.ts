import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Обработка загрузки новой модели (POST-запрос)
export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const name = data.get('name') as string;
    const glbFile = data.get('glb') as File;
    const usdzFile = data.get('usdz') as File;

    if (!name || !glbFile || !usdzFile) {
      return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
    }

    // Читаем файлы в буфер памяти
    const glbBuffer = Buffer.from(await glbFile.arrayBuffer());
    const usdzBuffer = Buffer.from(await usdzFile.arrayBuffer());

    // Генерируем уникальные имена для файлов, чтобы они не перезаписали друг друга
    const glbFileName = `${Date.now()}_${glbFile.name}`;
    const usdzFileName = `${Date.now()}_${usdzFile.name}`;

    // Сохраняем файлы в закрытую папку private_uploads
    const glbPath = path.join(process.cwd(), 'private_uploads', glbFileName);
    const usdzPath = path.join(process.cwd(), 'private_uploads', usdzFileName);

    await writeFile(glbPath, glbBuffer);
    await writeFile(usdzPath, usdzBuffer);

    // Записываем информацию о модели в базу данных
    const model = await prisma.model.create({
      data: {
        name,
        glbPath: glbFileName,
        usdzPath: usdzFileName,
      }
    });

    return NextResponse.json(model);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    return NextResponse.json({ error: 'Ошибка при сохранении модели' }, { status: 500 });
  }
}

// Получение списка всех моделей (GET-запрос)
export async function GET() {
  const models = await prisma.model.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(models);
}