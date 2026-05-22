import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ImageOptimizerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  alt: string;
  className?: string;
  maxWidth?: number; // Target width to reduce large base64 strings to, e.g., 300
  quality?: number; // 0 to 1 for JPEG compression
  fallback?: React.ReactNode;
}

/**
 * Compresses/resizes a high-res base64 image (or image file) to target dimensions.
 * Extremely useful for optimizing storage footprint before saving to Firestore.
 */
export const optimizeImageBeforeUpload = (
  file: File | string,
  maxWidth = 400,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if image exceeds maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Draw with smoothing/interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed WebP (or JPEG if browser doesn't support WebP)
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for optimization'));
    };

    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read upload file'));
      };
      reader.readAsDataURL(file);
    }
  });
};

// In-memory cache for compressed base64 URLs so we don't resize them on every render
const optimizedCache = new Map<string, string>();

/**
 * ImageOptimizer Component
 * Renders an optimized image. If the src is a massive base64 string or complex URL, 
 * it scales it down on-the-fly dynamically via HTML Canvas, caches the result, 
 * supports lazy loading, and utilizes srcset/sizes if appropriate.
 */
export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  className = '',
  maxWidth = 300,
  quality = 0.75,
  fallback,
  ...props
}) => {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      setLoading(false);
      setError(false);
      return;
    }

    // 1. If it's a standard short URL (not base64), we can load it directly
    // and let the browser use standard loading/srcset optimizations if offered
    const isBase64 = src.startsWith('data:');
    const isHuge = isBase64 && src.length > 100 * 1024; // > 100KB is massive for an avatar/thumbnail in memory

    if (!isHuge) {
      setDisplaySrc(src);
      setLoading(false);
      setError(false);
      return;
    }

    // 2. Check the in-memory cache first to avoid re-rendering bottleneck
    const cacheKey = `${src.substring(0, 100)}_${src.length}_${maxWidth}_${quality}`;
    if (optimizedCache.has(cacheKey)) {
      setDisplaySrc(optimizedCache.get(cacheKey) || null);
      setLoading(false);
      setError(false);
      return;
    }

    // 3. Perform on-the-fly downscaling on a web canvas thread safely of the base64 image
    setLoading(true);
    let active = true;

    optimizeImageBeforeUpload(src, maxWidth, quality)
      .then((compressed) => {
        if (active) {
          optimizedCache.set(cacheKey, compressed);
          setDisplaySrc(compressed);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('Image optimization failed on-the-fly:', e);
        if (active) {
          setDisplaySrc(src); // fallback to original high-res string if compression fails
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [src, maxWidth, quality]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800 ${className}`}>
        {fallback || <AlertCircle className="text-zinc-600 w-6 h-6" />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-brand-accent w-5 h-5" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-10 text-rose-500/50">
          <AlertCircle className="w-5 h-5" />
        </div>
      ) : displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          {...props}
        />
      ) : null}
    </div>
  );
};
