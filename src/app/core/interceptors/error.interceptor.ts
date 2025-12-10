import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Logger } from '../utils/logger';

/**
 * HTTP Interceptor para manejo centralizado de errores
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error) => {
            Logger.error('HTTP Error:', error);

            let errorMessage = 'An error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }

            // Aquí podrías agregar lógica para mostrar un toast o notificación al usuario
            // Por ejemplo, usando un servicio de notificaciones

            return throwError(() => new Error(errorMessage));
        })
    );
};
