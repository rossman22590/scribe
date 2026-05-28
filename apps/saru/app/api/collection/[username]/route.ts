import { NextResponse } from 'next/server';
import { getPublicDocumentsByUsername } from '@/lib/db/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const publicDocuments = await getPublicDocumentsByUsername({ 
      username,
      limit: 100 
    });
    
    return NextResponse.json({
      documents: publicDocuments,
      count: publicDocuments.length,
      username
    });
  } catch (error) {
    console.error('Error fetching user public documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user documents' },
      { status: 500 }
    );
  }
}