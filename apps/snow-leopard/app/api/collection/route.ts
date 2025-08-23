import { NextResponse } from 'next/server';
import { getPublicDocuments } from '@/lib/db/queries';

export async function GET() {
  try {
    const publicDocuments = await getPublicDocuments({ limit: 100 });
    
    return NextResponse.json({
      documents: publicDocuments,
      count: publicDocuments.length
    });
  } catch (error) {
    console.error('Error fetching public documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public documents' },
      { status: 500 }
    );
  }
}