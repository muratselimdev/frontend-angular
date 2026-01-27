import { defineConfig } from 'vite';
import { ngVite } from '@angular/build';

export default defineConfig({
  plugins: [ngVite()],
  server: {
    host: true,
    port: 4200,
    https: true,
    allowedHosts: ['oneclinic-soft'], // 🔥 ÇÖZÜM
  }
});
