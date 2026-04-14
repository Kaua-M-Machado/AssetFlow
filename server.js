const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const INVENTARIO_PATH = path.join(__dirname, 'inventario.json');

// Initialize inventario.json if it doesn't exist
if (!fs.existsSync(INVENTARIO_PATH)) {
  fs.writeFileSync(INVENTARIO_PATH, JSON.stringify([], null, 2), 'utf8');
}

function readInventario() {
  try {
    const data = fs.readFileSync(INVENTARIO_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeInventario(data) {
  fs.writeFileSync(INVENTARIO_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/ativos' && req.method === 'GET') {
    const data = readInventario();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (pathname === '/api/ativos' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const novoAtivo = JSON.parse(body);
        const ativos = readInventario();
        
        // Auto-generate ID
        const maxId = ativos.length > 0 ? Math.max(...ativos.map(a => a.id)) : 0;
        novoAtivo.id = maxId + 1;
        novoAtivo.dataCadastro = new Date().toISOString();
        
        ativos.push(novoAtivo);
        writeInventario(ativos);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(novoAtivo));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/ativos/') && req.method === 'DELETE') {
    const id = parseInt(pathname.split('/')[3]);
    const ativos = readInventario();
    const idx = ativos.findIndex(a => a.id === id);
    if (idx === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    ativos.splice(idx, 1);
    writeInventario(ativos);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}\n`);
});
