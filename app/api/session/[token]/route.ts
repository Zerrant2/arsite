import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const session = await prisma.session.findUnique({
    where: { id: token },
    include: { model: true },
  });
  return NextResponse.json(session);
}