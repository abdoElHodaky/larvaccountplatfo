/**
 * Document Head Component
 * Wrapper around react-helmet-async for consistent SEO management
 * Provides migration path from Inertia.js Head component
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface DocumentHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  children?: React.ReactNode;
}

export const DocumentHead: React.FC<DocumentHeadProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary',
  twitterSite,
  twitterCreator,
  children
}) => {
  // Build full title with app name
  const fullTitle = title ? `${title} - Laravel Accounting Platform` : 'Laravel Accounting Platform';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={ogTitle || fullTitle} />
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      {ogDescription && <meta name="twitter:description" content={ogDescription} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

      {/* Additional custom head elements */}
      {children}
    </Helmet>
  );
};

// Legacy compatibility - alias for easy migration from Inertia Head
export const Head = DocumentHead;

export default DocumentHead;
