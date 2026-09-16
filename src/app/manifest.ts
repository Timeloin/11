import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Simran Mobile',
    short_name: 'Simran Mobile',
    description: 'Simran Mobile Inventory & Shop Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f4f8',
    theme_color: '#4965fa',
    orientation: 'portrait',
    icons: [
      {
        src: '/api/app-icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/api/app-icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
