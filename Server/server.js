const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('build'));

// Proxy requests to Go server
app.use('/api', createProxyMiddleware({ target: 'http://localhost:8080', changeOrigin: true }));

app.listen(port, () => console.log(`Server running on port ${port}`));
