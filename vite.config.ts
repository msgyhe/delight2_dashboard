
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel 환경 변수를 브라우저에서 사용할 수 있도록 주입
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
