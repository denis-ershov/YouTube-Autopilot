import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react() as any],
    build: {
      modulePreload: false,
    },
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    permissions: ['storage'],
    host_permissions: ['https://*.youtube.com/*'],
    default_locale: 'en',
    action: {
      default_title: '__MSG_extName__',
    },
    options_ui: {
      page: 'dashboard.html',
      open_in_tab: true,
    },
    browser_specific_settings: {
      gecko: {
        id: 'youtube-autopilot@addon',
        strict_min_version: '109.0',
      },
    },
  },
});
