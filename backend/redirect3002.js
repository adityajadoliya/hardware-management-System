const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(307, { Location: `http://localhost:3000${req.url || '/'}` });
  res.end();
});

server.listen(3002, () => {
  console.log('Redirecting http://localhost:3002 -> http://localhost:3000');
});
