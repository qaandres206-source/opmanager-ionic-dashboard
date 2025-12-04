const fetch = require('node-fetch');

/**
 * Azure Function para proxy de API de OpManager
 * Compatible con Azure Static Web Apps
 */

const API_BASE_URL = 'https://itview.intwo.cloud/api';

module.exports = async function (context, req) {
    const path = req.params.path || '';

    // Construir URL completa
    const url = new URL(path, API_BASE_URL);

    // Copiar query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            url.searchParams.append(key, req.query[key]);
        });
    }

    context.log(`Proxying request: ${req.method} ${url.toString()}`);

    try {
        // Preparar headers
        const headers = {
            'Content-Type': 'application/json',
        };

        // Pasar headers importantes del cliente
        if (req.headers.apikey) {
            headers['apikey'] = req.headers.apikey;
        }
        if (req.headers.authorization) {
            headers['authorization'] = req.headers.authorization;
        }

        // Configurar opciones de fetch
        const options = {
            method: req.method,
            headers: headers,
        };

        // Agregar body para métodos que lo permiten
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        // Hacer la petición al API externo
        const response = await fetch(url.toString(), options);
        const data = await response.text();

        // Retornar respuesta con el mismo status code
        context.res = {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/json',
            },
            body: data
        };

    } catch (error) {
        context.log.error('Proxy error:', error);

        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Proxy request failed',
                message: error.message
            })
        };
    }
};
