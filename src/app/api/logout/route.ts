import { getToday } from '@/lib/getToday';
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set({
    name: 'token',
    value: '',
    domain: process.env.COOKIES_DOMAIN,
    expires: getToday(),
    path: '/',
  });

  return response;
}
