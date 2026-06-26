import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onbeat.app',
  appName: 'onBeat',
  webDir: 'www',
  "server": {
    "androidScheme": "http"
  }
};

export default config;
