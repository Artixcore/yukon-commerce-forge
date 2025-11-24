import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Check if running in Docker build (CI/CD or Docker environment)
const isDockerBuild = process.env.DOCKER_BUILD === 'true' || process.env.CI === 'true' || process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
            urlPattern: /^https:\/\/pnrchmxpywyqvvwzbvwe\.supabase\.co\/storage\/v1\/object\/public\/products-images\/.*/i,
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
            urlPattern: /^https:\/\/pnrchmxpywyqvvwzbvwe\.supabase\.co\/rest\/v1\/.*/i,
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
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    // Increase chunk size warning limit to reduce warnings (chunks are still optimized)
    chunkSizeWarningLimit: 1000, // Increased to reduce noise, chunks are still optimized via manualChunks
    rollupOptions: {
      output: {
        // Optimized chunking strategy to reduce memory usage and prevent large chunks
        // CRITICAL: Bundle React with all React-dependent libraries to prevent forwardRef errors
        manualChunks: (id) => {
          // Bundle React and ALL React-dependent libraries together
          // This ensures React is always available when any React code executes
          if (
            id.includes('node_modules/react/') || 
            id.includes('node_modules/react-dom/') ||
            id === 'node_modules/react' ||
            id === 'node_modules/react-dom' ||
            id.includes('node_modules/react/index') ||
            id.includes('node_modules/react-dom/index') ||
            // React Router (depends on React)
            id.includes('node_modules/react-router') ||
            // Radix UI components (all use React.forwardRef)
            id.includes('node_modules/@radix-ui') ||
            // React Query (depends on React)
            id.includes('node_modules/@tanstack/react-query') ||
            // Other React-dependent libraries
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/react-day-picker') ||
            id.includes('node_modules/embla-carousel-react') ||
            id.includes('node_modules/react-resizable-panels') ||
            id.includes('node_modules/next-themes')
          ) {
            return 'react-vendor';
          }
          // Split large libraries into separate chunks
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // Supabase client (can be large)
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          // Form validation libraries
          if (id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'forms';
          }
          // UI utilities
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/cmdk')) {
            return 'ui-utils';
          }
          // Vendor chunk for remaining node_modules (non-React dependencies)
          if (id.includes('node_modules')) {
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
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
    exclude: ['lucide-react'],
    esbuildOptions: {
      // Ensure React is properly resolved
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  },
}));
