import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Исправлено для Next.js 15+
) {
  const resolvedParams = await params;
  const modelId = parseInt(resolvedParams.id);

  if (isNaN(modelId)) {
    return NextResponse.json({ error: 'Неверный ID' }, { status: 400 });
  }

  // 1. Проверяем, существует ли модель
  const model = await prisma.model.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    return NextResponse.json({ error: 'Модель не найдена' }, { status: 404 });
  }

  // 2. Создаем временную сессию (токен) на 30 минут
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Текущее время + 30 мин

  const session = await prisma.session.create({
    data: {
      modelId: model.id,
      expiresAt: expiresAt,
    },
  });

  // 3. Перенаправляем пользователя на страницу просмотра с этим токеном
  // Пользователь увидит в браузере: yoursite.com/view/uuid-token-here
  redirect(`/view/${session.id}`);
}