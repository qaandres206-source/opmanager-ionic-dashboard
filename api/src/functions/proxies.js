const { app } = require('@azure/functions');

/**
 * Azure Function para proxy de API de OpManager
 * Reemplaza el servidor Express (server/index.js) para Azure Static Web Apps
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://itview.intwo.cloud/api';

app.http('proxies', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    authLevel: 'anonymous',
    route: '{*path}',
    handler: async (request, context) => {
        const path = request.params.path || '';

        // Construir URL completa
        const url = new URL(path, API_BASE_URL);

        // Copiar query parameters
        const searchParams = new URLSearchParams(request.query);
        searchParams.forEach((value, key) => {
            url.searchParams.append(key, value);
        });

        context.log(`Proxying request: ${request.method} ${url.toString()}`);

        try {
            // Importar node-fetch dinámicamente
            const fetch = (await import('node-fetch')).default;

            // Preparar headers
            const headers = {
                'Content-Type': 'application/json',
            };

            // Pasar headers importantes del cliente
            if (request.headers.get('apikey')) {
                headers['apikey'] = request.headers.get('apikey');
            }
            if (request.headers.get('authorization')) {
                headers['authorization'] = request.headers.get('authorization');
            }

            // Configurar opciones de fetch
            const options = {
                method: request.method,
                headers: headers,
            };

            // Agregar body para métodos que lo permiten
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                try {
                    const body = await request.text();
                    if (body) {
                        options.body = body;
                    }
                } catch (error) {
                    context.log('No body to parse');
                }
            }

            // Hacer la petición al API externo
            const response = await fetch(url.toString(), options);
            const data = await response.text();

            // Retornar respuesta con el mismo status code
            return {
                status: response.status,
                headers: {
                    'Content-Type': response.headers.get('content-type') || 'application/json',
                },
                body: data
            };

        } catch (error) {
            context.error('Proxy error:', error);

            return {
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
    }
});
