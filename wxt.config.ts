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
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://*.youtube.com/*'],
    default_locale: 'en',
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_title: '__MSG_extName__',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
      },
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
