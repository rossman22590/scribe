"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
function createExcerpt(content: string | null, maxLength: number = 100): string {
  if (!content) return 'No preview available.';
  
  const cleanContent = content
    .replace(/[#*_`~\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanContent.length <= maxLength) return cleanContent;
  
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return lastSpaceIndex > 0 
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
}

export default function EmbedUserCollectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const layout = searchParams.get('layout') || 'list'; // 'list' or 'grid'
  const limit = parseInt(searchParams.get('limit') || '6');
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchUserDocuments = async () => {
      try {
        const response = await fetch(`/api/collection/${encodeURIComponent(username)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to fetch documents');
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
      <div className={`p-4 bg-white font-sans ${layout === 'grid' ? 'min-h-[400px]' : 'min-h-[300px]'}`}>
        <div className="mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-48 mt-2 animate-pulse"></div>
        </div>
        <div className={layout === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {[...Array(layout === 'grid' ? 4 : 3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white min-h-[200px] font-sans text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">@{username}</h3>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const displayLimit = Math.min(limit, documents.length);
  const showViewAll = documents.length > displayLimit;

  return (
    <div className={`p-4 bg-white font-sans ${layout === 'grid' ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">@{username}</h3>
        <p className="text-sm text-gray-600">
          {documents.length} document{documents.length !== 1 ? 's' : ''} published
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">No documents published yet.</p>
        </div>
      ) : (
        <div className={`max-h-96 overflow-y-auto ${
          layout === 'grid'
            ? 'grid grid-cols-2 gap-3'
            : 'space-y-3'
        }`}>
          {documents.slice(0, displayLimit).map((doc) => {
            const documentUrl = doc.username && doc.slug
              ? `${baseUrl}/${doc.username}/${doc.slug}`
              : `${baseUrl}/documents/${doc.id}`;
            const excerpt = createExcerpt(doc.content, layout === 'grid' ? 80 : 100);
            
            return (
              <a
                key={doc.id}
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group ${
                  layout === 'grid' ? 'p-3 h-32 flex flex-col justify-between' : 'p-3'
                }`}
              >
                <div>
                  <h4 className={`font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 ${
                    layout === 'grid' ? 'text-xs mb-1' : 'text-sm mb-1'
                  }`}>
                    {doc.title}
                  </h4>
                  <p className={`text-gray-600 mb-2 line-clamp-2 ${
                    layout === 'grid' ? 'text-xs' : 'text-xs'
                  }`}>
                    {excerpt}
                  </p>
                </div>
                <div className={`flex justify-between items-center text-xs text-gray-500 ${
                  layout === 'grid' ? 'mt-auto' : ''
                }`}>
                  <span className={layout === 'grid' ? 'text-xs' : ''}>
                    {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                  </span>
                  <span className="text-blue-600 group-hover:text-blue-700">Read →</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
      
      {showViewAll && (
        <div className="mt-3">
          <a
            href={`${baseUrl}/collection/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all {documents.length} documents →
          </a>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100">
        <a
          href={`${baseUrl}/collection/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Powered by AI Tutor Scribe
        </a>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}