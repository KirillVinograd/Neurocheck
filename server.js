const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow raw body for upload test
app.use('/api/upload-test', express.raw({ type: '*/*', limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/api/ping', (_req, res) => {
  res.send('OK');
});

app.get('/api/download-test', (_req, res) => {
  const sizeInBytes = 1.5 * 1024 * 1024; // ~1.5MB
  const buffer = Buffer.alloc(Math.floor(sizeInBytes), 'a');
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store'
  });
  res.send(buffer);
});

app.post('/api/upload-test', (req, res) => {
  // Body already parsed as Buffer by express.raw
  res.set('Cache-Control', 'no-store');
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
