import express from 'express';
import { createProxyServer } from 'http-proxy';
import type { Request, Response } from 'express';
import { g } from '../internals/json-writer/main';
import { ifNotNone, tap } from '@custom-express/better-standard-library';
import { getSubdomain } from './utils/main';

const app = express();
const proxy = createProxyServer({});



app.use(express.json());

function getPortFromSubdomain(subdomain: string): number {
  console.log(subdomain)
  
  return (tap(g.get().deployments, console.log).find(v => v.domain === subdomain))?.port
}

app.use((req: Request, res: Response) => {
  const host = req.headers.host || '';
  const subdomain = getSubdomain(host);
  if (!subdomain) {
    return res.status(400).json({ error: 'No subdomain in host header' });
  }

  const port = getPortFromSubdomain(subdomain);
  const target = `http://localhost:${port}`;

  console.log(`[INFO] Proxying ${req.method} ${req.url} to ${target}`);

  proxy.web(req, res, { target }, (err) => {
    console.error(`[ERROR] Proxy failed: ${err.message}`);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad Gateway' });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

