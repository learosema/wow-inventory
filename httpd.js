import EventEmitter from 'events';
import { readFile } from 'fs';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import path from 'node:path';
import url from "node:url";

function getMime(path) {
  if (/\.html?$/.test(path)) return 'text/html';
  if (/\.css$/.test(path)) return 'text/css';
  if (/\.gif$/.test(path)) return 'image/gif';
  if (/\.png$/.test(path)) return 'image/png';
  if (/\.webp$/.test(path)) return 'image/webp';
  if (/\.jpe?g$/.test(path)) return 'image/jpeg';
  if (/\.svg$/.test(path)) return 'image/svg+xml';
  if (/\.xml$/.test(path)) return 'text/xml';
  if (/\.js$/.test(path)) return 'text/javascript';
  if (/\.json$/.test(path)) return 'application/json';
  if (/\.midi?$/.test(path)) return 'audio/midi';
  if (/\.ico$/.test(path)) return 'image/vnd.microsoft.icon';
  return 'application/octet-stream' 
}

function sendFactory(req, res) {
  const send = (code, content, mimetype = 'text/html') => {
    console.log(`[http]\t (${code}) ${req.method} ${req.url}`);
    res.writeHead(code, { 'Content-Type': mimetype, 'Cache-Control': 'no-cache' });
    res.end(content);
  }
  const sendError = (code, message) => send(code, `${code} ${message}`);
  return { send, sendError };  
}



export function serve(eventEmitter = null, wwwRoot = 'public') {
  const port = process.env.PORT || 8000;
  console.log(`[http]\tServer listening on http://localhost:${port}/`);
  createServer((req, res) => {
    const uri = url.parse(req.url).pathname;
    const { send, sendError } = sendFactory(req, res);
    if (eventEmitter && uri === '/_dev-events') {
      serverSentEvents(req, res, eventEmitter);
      return;
    }

    const dir = path.resolve(process.cwd(), wwwRoot);
    const resourcePath = path.normalize(uri + (uri.endsWith('/') ? 'index.html' : ''));
    if (resourcePath.split('/').includes('..')) {
      sendError(404, 'Not Found');
      return;
    }
    const filePath = path.join(dir, resourcePath);
    readFile(filePath, (err, data) => {
      if (err) {
        sendError(404, 'Not Found');
        return;
      }
      const mime = getMime(resourcePath);
      if (data && mime === 'text/html') {
        send(200, data.toString(), mime);
        return;
      }
      send(200, data, mime);
    });
  }).listen(port);
}

serve();