import * as functions from 'firebase-functions';
import * as https from 'https';

const API_BASE_URL = 'https://itview.intwo.cloud/api';

// Simple in-memory cache with TTL
interface CacheEntry {
    data: string;
    timestamp: number;
    headers: Record<string, string>;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * API Proxy Cloud Function with caching
 * Reduces API calls and costs by caching responses
 */
export const apiProxy = functions
    .runWith({
        timeoutSeconds: 30,
        memory: '256MB',
    })
    .https.onRequest(async (req, res) => {
        // Enable CORS
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        // Allow both camelCase and lowercase apiKey
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, apiKey');

        // Handle preflight
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        // Health check endpoint
        if (req.path === '/health' || req.path === '/api/health') {
            res.status(200).json({ status: 'ok', timestamp: Date.now() });
            return;
        }

        try {
            // Build target URL
            const path = req.path.replace('/api', '');
            const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
            const targetUrl = `${API_BASE_URL}${path}${queryString}`;

            // Get API key from headers (check both cases)
            const apiKey = req.get('apiKey') || req.get('apikey');

            // Create cache key (only for GET requests)
            const cacheKey = req.method === 'GET' ? `${req.method}:${targetUrl}:${apiKey || ''}` : null;

            // Check cache for GET requests
            if (cacheKey && cache.has(cacheKey)) {
                const cached = cache.get(cacheKey)!;
                const age = Date.now() - cached.timestamp;

                if (age < CACHE_TTL) {
                    console.log(`Cache HIT for ${path} (age: ${Math.round(age / 1000)}s)`);

                    // Set cached headers
                    Object.entries(cached.headers).forEach(([key, value]) => {
                        res.set(key, value);
                    });
                    res.set('X-Cache', 'HIT');
                    res.set('X-Cache-Age', Math.round(age / 1000).toString());

                    res.status(200).send(cached.data);
                    return;
                } else {
                    // Remove expired cache entry
                    cache.delete(cacheKey);
                }
            }

            console.log(`Proxying ${req.method} request to: ${targetUrl}`);

            // Prepare headers
            const headers: Record<string, string> = {
                'Content-Type': req.get('Content-Type') || 'application/json',
                'User-Agent': 'OpManager-Dashboard/1.0 (Firebase Cloud Function)', // Add User-Agent
            };

            // Explicitly set apiKey if present (prefer camelCase for OpManager)
            if (apiKey) {
                headers['apiKey'] = apiKey;
            }

            if (req.get('Authorization')) {
                headers['Authorization'] = req.get('Authorization')!;
            }

            // Make request to external API using native https module
            const response = await makeHttpsRequest(targetUrl, {
                method: req.method,
                headers,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
            });

            // Forward response headers
            const responseHeaders: Record<string, string> = {};
            Object.entries(response.headers).forEach(([key, value]) => {
                if (!key.toLowerCase().startsWith('access-control-') && value) {
                    const headerValue = Array.isArray(value) ? value[0] : value;
                    res.set(key, headerValue);
                    responseHeaders[key] = headerValue;
                }
            });

            res.set('X-Cache', 'MISS');
            res.status(response.statusCode);

            // Cache successful GET responses
            if (cacheKey && response.statusCode === 200) {
                cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now(),
                    headers: responseHeaders,
                });

                // Clean old cache entries (simple cleanup)
                if (cache.size > 100) {
                    const now = Date.now();
                    for (const [key, entry] of cache.entries()) {
                        if (now - entry.timestamp > CACHE_TTL) {
                            cache.delete(key);
                        }
                    }
                }
            }

            res.send(response.data);
        } catch (error: any) {
            // Log error details with console.log to ensure visibility in Firebase logs
            console.log('Proxy error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
                path: req.path,
                targetUrl: error.targetUrl // Custom field if we add it
            });

            res.status(error.statusCode || 502).json({
                error: 'Proxy Error',
                message: error.message,
                details: 'Check Firebase Functions logs for more information'
            });
        }
    });

/**
 * Make HTTPS request using native Node.js https module
 * More efficient than fetch for Cloud Functions
 */
function makeHttpsRequest(
    url: string,
    options: { method: string; headers: Record<string, string>; body?: string }
): Promise<{ statusCode: number; headers: Record<string, string | string[]>; data: string }> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method,
            headers: options.headers,
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode || 500,
                    headers: res.headers as Record<string, string | string[]>,
                    data,
                });
            });
        });

        req.on('error', (error) => {
            console.log(`HTTPS Request Error for ${url}:`, error); // Log inside the request error handler
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}
