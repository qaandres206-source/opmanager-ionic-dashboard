const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'https://itview.intwo.cloud/api';

// Middleware
app.use(compression());
app.use(helmet({
    contentSecurityPolicy: false, // Angular maneja CSP
}));
app.use(cors());
app.use(express.json());

// API Proxy - maneja todas las peticiones a /api/*
app.all('/api/*', async (req, res) => {
    const apiPath = req.path.replace('/api', '');
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const targetUrl = `${API_BASE_URL}${apiPath}${queryString}`;

    try {
        const fetch = (await import('node-fetch')).default;

        // Preparar headers, pasando los headers importantes del cliente
        const headers = {
            'Content-Type': 'application/json',
        };

        // Pasar el API key si existe
        if (req.headers.apikey) {
            headers.apikey = req.headers.apikey;
        }
        if (req.headers.authorization) {
            headers.authorization = req.headers.authorization;
        }

        const options = {
            method: req.method,
            headers: headers,
        };

        // Agregar body para métodos que lo permiten
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, options);
        const data = await response.text();

        // Pasar el status code y la respuesta
        res.status(response.status).send(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed', message: error.message });
    }
});

// Servir archivos estáticos de Angular
app.use(express.static(path.join(__dirname, '../www')));

// Todas las rutas no API redirigen a index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../www/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API proxy: /api/* -> ${API_BASE_URL}/*`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '../www')}`);
});
