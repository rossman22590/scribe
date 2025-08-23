"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Crimson_Text } from "next/font/google";
import { formatDistanceToNow } from 'date-fns';

const crimson = Crimson_Text({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

interface PublicDocument {
  id: string;
  title: string;
  createdAt: string;
  author: string | null;
  slug: string | null;
  content: string | null;
  username: string | null;
}

interface CollectionResponse {
  documents: PublicDocument[];
  count: number;
}

// Helper function to create excerpt from content
function createExcerpt(content: string | null, maxLength: number = 150): string {
  if (!content) return 'No preview available.';
  
  // Remove markdown formatting and extra whitespace
  const cleanContent = content
    .replace(/[#*_`~\[\]()]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (cleanContent.length <= maxLength) return cleanContent;
  
  // Find the last complete word within the limit
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return lastSpaceIndex > 0
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
}

export default function CollectionPage() {
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/collection');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data: CollectionResponse = await response.json();
        setDocuments(data.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-20">
          <div className="text-center mb-16">
            <h1 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
              Collection
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Loading public documents...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-[280px] rounded-xl animate-pulse">
                <CardHeader className="p-6 border-b border-border border-opacity-20">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-20">
          <div className="text-center">
            <h1 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
              Collection
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-4 border-b border-border">
        <div className="container mx-auto flex justify-between items-center px-6 md:px-8 lg:px-12">
          <Link href="/" className="text-xl font-normal tracking-tighter text-foreground/90 hover:text-foreground transition-colors">
            AI Tutor Scribe
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
            Collection
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Discover public documents shared by the community
          </p>
          {documents.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              No public documents available yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to publish a document!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const authorName = doc.author || doc.username || 'Anonymous';
              const documentUrl = doc.username && doc.slug
                ? `/${doc.username}/${doc.slug}`
                : `/documents/${doc.id}`;
              const excerpt = createExcerpt(doc.content);
              
              return (
                <Link key={doc.id} href={documentUrl}>
                  <Card className="h-full flex flex-col min-h-[280px] rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                    <CardHeader className="p-6 border-b border-border border-opacity-20">
                      <CardTitle className="text-xl font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {doc.title}
                      </CardTitle>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <span>by {authorName}</span>
                        <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-grow flex flex-col justify-between">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          {excerpt}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        Click to read →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-background/80 backdrop-blur-sm py-4 mt-8">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} AI Tutor Scribe. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}