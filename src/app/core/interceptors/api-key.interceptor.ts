import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP Interceptor que agrega automáticamente el API key a las peticiones
 * que van a la API de OpManager
 */
export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
    const apiKey = localStorage.getItem('opmanagerApiKey');

    // Solo agregar el API key si existe y la petición es a la API
    if (apiKey && req.url.includes('/api/')) {
        const cloned = req.clone({
            setHeaders: {
                apiKey: apiKey
            }
        });
        return next(cloned);
    }

    return next(req);
};
