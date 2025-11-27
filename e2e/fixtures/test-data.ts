/**
 * Test data and fixtures for E2E tests
 */

export const TEST_API_KEY = process.env.TEST_API_KEY || 'test-api-key-placeholder';

export const MOCK_DEVICE = {
    displayName: 'Test Device',
    ipaddress: '192.168.1.1',
    statusStr: 'Clear',
    category: 'Server',
};

export const MOCK_ALERT = {
    severity: 'Critical',
    deviceName: 'Test Device',
    message: 'Test alert message',
    status: 'active',
};

export const TIMEOUTS = {
    short: 5000,
    medium: 10000,
    long: 30000,
};
