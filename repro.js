const https = require('https');

const API_BASE_URL = 'https://itview.intwo.cloud/api';
const targetUrl = `${API_BASE_URL}/json/v2/device/listDevices?regionID=-1&selCustomerID=-1`;

console.log(`Testing connection to: ${targetUrl}`);

function makeHttpsRequest(url, options) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method,
            headers: options.headers,
        };

        console.log('Request options:', reqOptions);

        const req = https.request(reqOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Response status:', res.statusCode);
                console.log('Response headers:', res.headers);
                resolve({
                    statusCode: res.statusCode || 500,
                    headers: res.headers,
                    data,
                });
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function test() {
    try {
        const headers = {
            'Content-Type': 'application/json',
            // Simulate missing User-Agent
        };

        // Add a dummy apiKey if needed, but 401 is better than 502
        // headers['apiKey'] = 'test';

        const response = await makeHttpsRequest(targetUrl, {
            method: 'GET',
            headers,
        });

        console.log('Success:', response.statusCode);
    } catch (error) {
        console.error('Failed:', error);
    }
}

test();
