"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crimson_Text } from "next/font/google";
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Code, Copy, Check } from 'lucide-react';

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

interface UserCollectionResponse {
  documents: PublicDocument[];
  count: number;
  username: string;
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

export default function UserCollectionPage() {
  const params = useParams();
  const username = params.username as string;
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [embedLayout, setEmbedLayout] = useState<'list' | 'grid'>('list');
  const [embedLimit, setEmbedLimit] = useState(6);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';
  
  const generateEmbedCode = () => {
    const params = new URLSearchParams();
    if (embedLayout !== 'list') params.set('layout', embedLayout);
    if (embedLimit !== 6) params.set('limit', embedLimit.toString());
    
    const embedUrl = `${baseUrl}/embed/collection/${username}${params.toString() ? '?' + params.toString() : ''}`;
    const width = embedLayout === 'grid' ? '600' : '400';
    const height = embedLayout === 'grid' ? '500' : '400';
    
    return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>`;
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  useEffect(() => {
    if (!username) return;

    const fetchUserDocuments = async () => {
      try {
        const response = await fetch(`/api/collection/${encodeURIComponent(username)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found or has no public documents');
          }
          throw new Error('Failed to fetch user documents');
        }
        const data: UserCollectionResponse = await response.json();
        setDocuments(data.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDocuments();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-20">
          <div className="text-center mb-16">
            <h1 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
              @{username}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Loading documents...
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
        {/* Header */}
        <header className="w-full py-4 border-b border-border">
          <div className="container mx-auto flex justify-between items-center px-6 md:px-8 lg:px-12">
            <Link href="/" className="text-xl font-normal tracking-tighter text-foreground/90 hover:text-foreground transition-colors">
              AI Tutor Scribe
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-6 md:px-8 lg:px-12 py-20">
          <div className="text-center">
            <h1 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
              @{username}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {error}
            </p>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/collection">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Collection
                </Link>
              </Button>
            </div>
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
          <div className="mb-4 flex items-center justify-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/collection">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Collection
              </Link>
            </Button>
            
            {documents.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Code className="w-4 h-4 mr-2" />
                    Embed Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Embed @{username}&apos;s Collection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Customize and copy this code to embed @{username}&apos;s document collection on your website:
                    </p>
                    
                    {/* Layout Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Layout Style
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="layout"
                              value="list"
                              checked={embedLayout === 'list'}
                              onChange={(e) => setEmbedLayout(e.target.value as 'list' | 'grid')}
                              className="mr-2"
                            />
                            <span className="text-sm">List (400px wide)</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="layout"
                              value="grid"
                              checked={embedLayout === 'grid'}
                              onChange={(e) => setEmbedLayout(e.target.value as 'list' | 'grid')}
                              className="mr-2"
                            />
                            <span className="text-sm">Grid (600px wide)</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Number of Documents
                        </label>
                        <select
                          value={embedLimit}
                          onChange={(e) => setEmbedLimit(parseInt(e.target.value))}
                          className="w-full border border-input rounded px-3 py-2 text-sm bg-background"
                        >
                          <option value={3}>3 documents</option>
                          <option value={4}>4 documents</option>
                          <option value={6}>6 documents</option>
                          <option value={8}>8 documents</option>
                          <option value={10}>10 documents</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generateEmbedCode()}</code>
                      </pre>
                      <Button
                        onClick={copyEmbedCode}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-2 text-sm">Preview:</h4>
                      <iframe
                        src={`${baseUrl}/embed/collection/${username}?layout=${embedLayout}&limit=${embedLimit}`}
                        width={embedLayout === 'grid' ? '600' : '400'}
                        height="300"
                        className="border border-border rounded"
                        title={`${username}&apos;s documents`}
                      />
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>• Widget dimensions: {embedLayout === 'grid' ? '600px × 500px' : '400px × 400px'}</p>
                      <p>• Shows up to {embedLimit} most recent documents</p>
                      <p>• Links open in new tab</p>
                      <p>• Responsive and mobile-friendly</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <h1 className={`text-4xl md:text-5xl font-medium ${crimson.className} tracking-tight text-foreground`}>
            @{username}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Public documents by {username}
          </p>
          {documents.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? 's' : ''} published
            </p>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              @{username} hasn&apos;t published any documents yet.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/collection">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Collection
                </Link>
              </Button>
            </div>
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
