import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const resolvedParams = await params; // Исправлено для Next.js 15+
  const fileType = resolvedParams.type; // 'glb' или 'usdz'

  if (!token) {
    return new NextResponse('Access Denied: No token provided', { status: 403 });
  }

  // 1. Ищем сессию в базе
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { model: true },
  });

  // 2. Проверяем валидность сессии
  if (!session) {
    return new NextResponse('Access Denied: Invalid token', { status: 403 });
  }

  if (new Date() > session.expiresAt) {
    return new NextResponse('Access Denied: Session expired', { status: 410 });
  }

  // 3. Определяем какой файл отдавать
  let filename = '';
  let contentType = '';

  if (fileType === 'glb') {
    filename = session.model.glbPath;
    contentType = 'model/gltf-binary';
  } else if (fileType === 'usdz') {
    filename = session.model.usdzPath;
    contentType = 'model/vnd.usdz+zip';
  } else {
    return new NextResponse('Invalid file type', { status: 400 });
  }

  // 4. Читаем файл из защищенной папки private_uploads
  try {
    const filePath = path.join(process.cwd(), 'private_uploads', filename);
    const fileBuffer = await readFile(filePath);

    // 5. Отдаем файл с правильными заголовками
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('File read error:', error);
    return new NextResponse('File not found on server', { status: 404 });
  }
}