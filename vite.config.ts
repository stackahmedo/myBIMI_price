import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'google-sheets-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api/proxy-sheet', async (req, res) => {
          try {
            const reqUrl = new URL(req.url!, 'http://localhost');
            const targetUrl = reqUrl.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }
            const fetched = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,*/*',
              },
            });
            if (!fetched.ok) {
              res.statusCode = fetched.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Remote returned status ${fetched.status}` }));
              return;
            }
            const arrayBuf = await fetched.arrayBuffer();
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', fetched.headers.get('content-type') || 'application/octet-stream');
            res.end(Buffer.from(arrayBuf));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Proxy fetch failed' }));
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
