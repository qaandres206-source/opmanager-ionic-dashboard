const fetch = require('node-fetch');

/**
 * Azure Function para proxy de API de OpManager
 * Ruta: /api/opmanager-proxy/*
 */

const API_BASE_URL = 'https://itview.intwo.cloud/api';

module.exports = async function (context, req) {
    const path = req.params.path || '';

    // Construir URL completa
    const url = `${API_BASE_URL}/${path}`;

    // Copiar query parameters
    const queryParams = new URLSearchParams();
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            queryParams.append(key, req.query[key]);
        });
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

    context.log(`[OpManager Proxy] ${req.method} ${fullUrl}`);

    // Validar que haya API Key
    const hasApiKey = req.headers.apikey || req.headers['apiKey'] || req.headers.authorization;
    if (!hasApiKey) {
        context.log.warn('[OpManager Proxy] No API Key provided');
        context.res = {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Unauthorized',
                message: 'API Key is required'
            })
        };
        return;
    }

    try {
        // Preparar headers
        const headers = {
            'Content-Type': 'application/json',
        };

        // Pasar headers importantes del cliente
        if (req.headers.apikey) {
            headers['apikey'] = req.headers.apikey;
        }
        if (req.headers['apiKey']) {
            headers['apiKey'] = req.headers['apiKey'];
        }
        if (req.headers.authorization) {
            headers['authorization'] = req.headers.authorization;
        }
        // Pasar cookies para mantener sesión
        if (req.headers.cookie) {
            headers['cookie'] = req.headers.cookie;
        }
        // Pasar User-Agent
        if (req.headers['user-agent']) {
            headers['user-agent'] = req.headers['user-agent'];
        }
        // Pasar Accept
        if (req.headers.accept) {
            headers['accept'] = req.headers.accept;
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
        const response = await fetch(fullUrl, options);
        const contentType = response.headers.get('content-type');

        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        context.log(`[OpManager Proxy] Response status: ${response.status}`);

        // Retornar respuesta con el mismo status code
        context.res = {
            status: response.status,
            headers: {
                'Content-Type': contentType || 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, apiKey, apikey, Authorization'
            },
            body: typeof data === 'string' ? data : JSON.stringify(data)
        };

    } catch (error) {
        context.log.error('[OpManager Proxy] Error:', error);

        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Proxy request failed',
                message: error.message,
                url: fullUrl
            })
        };
    }
};
