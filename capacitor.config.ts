export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  android?: {
    allowMixedContent?: boolean;
    backgroundColor?: string;
    captureInput?: boolean;
    webContentsDebuggingEnabled?: boolean;
  };
  server?: {
    androidScheme?: string;
  };
}

const config: CapacitorConfig = {
  appId: 'com.salah.neonplayer',
  appName: 'SALAH Neon Player',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    backgroundColor: '#070B2A',
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
