import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    } // Parse dates to get year, month, day values
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Format dates as YYYY-MM-DD strings using local timezone to avoid UTC conversion issues
    const startDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
      start.getDate()
    ).padStart(2, '0')}`;
    const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(
      end.getDate()
    ).padStart(2, '0')}`;

    console.log('Date range filter:', { startDateStr, endDateStr });
    console.log('Original dates:', { startDate, endDate });

    // Get finance data using raw SQL to avoid timezone issues
    const financeData = await prisma.$queryRaw`
      SELECT * FROM "Finance" 
      WHERE DATE("date") >= DATE(${startDateStr})
      AND DATE("date") <= DATE(${endDateStr})
      ORDER BY "date" DESC
    `;

    // Get operational costs using raw SQL to avoid timezone issues
    const operationalData = await prisma.$queryRaw`
      SELECT * FROM "Operational" 
      WHERE DATE("createdAt") >= DATE(${startDateStr})
      AND DATE("createdAt") <= DATE(${endDateStr})
      ORDER BY "createdAt" DESC
    `;

    console.log('Found finance records:', (financeData as any[]).length);
    console.log('Found operational records:', (operationalData as any[]).length);

    return NextResponse.json({
      financeData,
      operationalData,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch date range summary' }, { status: 500 });
  }
}
