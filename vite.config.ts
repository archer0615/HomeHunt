import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({ base: './', plugins: [react(), VitePWA({ registerType: 'prompt', includeAssets: [], manifest: { name: 'HomeHunt 房屋搜尋', short_name: 'HomeHunt', description: '找一個適合生活的家', display: 'standalone', start_url: './', theme_color: '#17324d', background_color: '#f5f8fb', lang: 'zh-Hant' } })] });
