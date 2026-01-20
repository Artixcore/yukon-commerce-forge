import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  canonical?: string;
  structuredData?: object;
}

export const SEO = ({
  title,
  description,
  image,
  type = 'website',
  canonical,
  structuredData,
}: SEOProps) => {
  const location = useLocation();
  const baseUrl = 'https://yukonlifestyle.com';
  const currentUrl = canonical || `${baseUrl}${location.pathname}${location.search}`;
  const defaultTitle = 'Yukon Lifestyle - Premium E-commerce Store';
  const defaultDescription = 'Discover quality lifestyle products at Yukon - Your trusted destination for fashion, accessories, and more';
  const defaultImage = 'https://storage.googleapis.com/gpt-engineer-file-uploads/BAcwIWg35vfca05h0vmsPFblsIj1/social-images/social-1761460493474-logo.png';

  useEffect(() => {
    // Update title
    document.title = title ? `${title} | Yukon Lifestyle` : defaultTitle;

    // Helper to update or create meta tags
    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(isProperty ? 'property' : 'name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update description
    updateOrCreateMeta('description', description || defaultDescription);

    // Update Open Graph tags
    updateOrCreateMeta('og:title', title || defaultTitle, true);
    updateOrCreateMeta('og:description', description || defaultDescription, true);
    updateOrCreateMeta('og:image', image || defaultImage, true);
    updateOrCreateMeta('og:type', type, true);
    updateOrCreateMeta('og:url', currentUrl, true);

    // Update Twitter Card tags
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', title || defaultTitle);
    updateOrCreateMeta('twitter:description', description || defaultDescription);
    updateOrCreateMeta('twitter:image', image || defaultImage);

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Add structured data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"][data-seo]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-seo', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup on unmount - reset to defaults
    return () => {
      document.title = defaultTitle;
      updateOrCreateMeta('description', defaultDescription);
      updateOrCreateMeta('og:title', defaultTitle, true);
      updateOrCreateMeta('og:description', defaultDescription, true);
      updateOrCreateMeta('og:image', defaultImage, true);
      updateOrCreateMeta('og:type', 'website', true);
      updateOrCreateMeta('og:url', baseUrl, true);
    };
  }, [title, description, image, type, currentUrl, structuredData, defaultTitle, defaultDescription, defaultImage, baseUrl]);

  return null;
};
