import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Check if running in Docker build (CI/CD or Docker environment)
const isDockerBuild = process.env.DOCKER_BUILD === 'true' || process.env.CI === 'true' || process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Extract Supabase domain from environment variable for dynamic URL patterns
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname.replace(/\./g, '\\.') : 'pnrchmxpywyqvvwzbvwe\\.supabase\\.co';
  
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    // Optimize VitePWA for Docker builds to prevent hanging
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'images/**/*'],
      
      manifest: {
        name: 'Yukon Lifestyle - Premium E-commerce',
        short_name: 'Yukon',
        description: 'Discover quality lifestyle products at Yukon',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.png',
            sizes: '95x95',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      
      workbox: {
        // Optimize glob patterns to reduce file processing during build
        // Only include essential files to prevent hanging on large directories
        globPatterns: isDockerBuild 
          ? ['**/*.{js,css,html,ico,png,svg}'] // Reduced pattern for Docker builds
          : ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        
        // Limit maximum file size to prevent processing huge files
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        
        // Optimize runtime caching for Docker builds
        runtimeCaching: [
          {
            urlPattern: new RegExp(`^https://${supabaseDomain}/storage/v1/object/public/products-images/.*`, 'i'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: new RegExp(`^https://${supabaseDomain}/rest/v1/.*`, 'i'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60,
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              }
            }
          }
        ],
        
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        
        // Optimize for Docker builds: reduce workbox processing overhead
        ...(isDockerBuild && {
          // Skip source maps in Docker builds
          dontCacheBustURLsMatching: /\.\w{8}\./,
          // Reduce manifest file size
          manifestTransforms: [],
        }),
      },
      
      devOptions: {
        enabled: false,
        type: 'module'
      },
      
      // Optimize build mode for Docker
      ...(isDockerBuild && {
        strategies: 'generateSW',
        injectRegister: 'script',
      }),
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure proper module resolution order
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    // Increase chunk size warning limit to reduce warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Enhanced chunking strategy to prevent initialization order issues
        // Key principle: React must load first, then React-dependent libraries in separate chunks
        // Split vendor chunk further to prevent circular dependencies and initialization errors
        manualChunks: (id) => {
          // CRITICAL: React and React-DOM must be in their own chunk and load first
          // This prevents "Cannot access 'T' before initialization" errors
          if (
            id.includes('node_modules/react/') || 
            id.includes('node_modules/react-dom/') ||
            id === 'node_modules/react' ||
            id === 'node_modules/react-dom'
          ) {
            return 'react-core';
          }
          
          // React Router - separate chunk (loads after React)
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          
          // Radix UI - separate chunk (loads after React)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          
          // React Query - separate chunk (loads after React)
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          
          // Form libraries - separate chunk
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'forms';
          }
          
          // Other React-dependent libraries - separate chunk
          if (id.includes('node_modules/react-day-picker') ||
              id.includes('node_modules/embla-carousel-react') ||
              id.includes('node_modules/react-resizable-panels') ||
              id.includes('node_modules/next-themes')) {
            return 'react-utils';
          }
          
          // Large charting library - separate chunk
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          
          // Supabase client - separate chunk
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          
          // UI utilities - separate chunk
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/cmdk')) {
            return 'ui-utils';
          }
          
          // State management libraries - separate chunk
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }
          
          // Date/time libraries - separate chunk
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          
          // PWA/Workbox libraries - separate chunk
          if (id.includes('node_modules/workbox') || 
              id.includes('node_modules/vite-plugin-pwa')) {
            return 'pwa';
          }
          
          // Utility libraries that might have initialization issues - separate chunk
          if (id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge') ||
              id.includes('node_modules/class-variance-authority')) {
            return 'utils';
          }
          
          // All other vendor dependencies - split into smaller chunks to prevent initialization issues
          if (id.includes('node_modules')) {
            // Use a hash-based approach to split large vendor chunks
            // This prevents circular dependencies and initialization order issues
            const match = id.match(/node_modules\/([^/]+)/);
            if (match) {
              const packageName = match[1];
              // Group smaller packages together, but keep large ones separate
              if (packageName.startsWith('@')) {
                return 'vendor-scoped';
              }
              // Keep common utility packages together
              if (['sweetalert2', 'sonner', 'vaul'].includes(packageName)) {
                return 'vendor-ui';
              }
            }
            return 'vendor';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    // Reduce memory usage during build
    reportCompressedSize: false, // Disable compressed size reporting to save memory
  },
  optimizeDeps: {
    // Pre-bundle critical dependencies to ensure proper initialization order
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
    ],
    exclude: ['lucide-react'],
    esbuildOptions: {
      // Ensure React is properly resolved
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  },
  };
});
