import { useState, useEffect } from 'react';

export const useImagePlaceholder = (src: string) => {
  const [placeholder, setPlaceholder] = useState<string>('');

  useEffect(() => {
    if (!src) return;

    // Generate tiny thumbnail for blur effect
    if (src.includes('supabase.co/storage')) {
      const separator = src.includes('?') ? '&' : '?';
      const tinyUrl = `${src}${separator}width=20&quality=50&format=webp`;
      setPlaceholder(tinyUrl);
    } else {
      setPlaceholder(src);
    }
  }, [src]);

  return placeholder;
};
