import { describe, it, expect, vi } from 'vitest';
import { app } from '../src/proxy-server/proxy-server';
import { JsonWriter } from '../src/internals/json-writer/main';
import { handleSubdomain } from '../src/proxy-server/proxy-server';

// Mock the JsonWriter
vi.mock('../src/internals/json-writer/main');

const mockJsonWriter = {
  get: vi.fn().mockReturnValue([])
};

vi.mocked(JsonWriter).new.mockReturnValue(mockJsonWriter);

describe('Proxy Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle subdomain routing', () => {
    const deployments = [
      { domain: 'test1', port: 3001 },
      { domain: 'test2', port: 3002 }
    ];

    vi.mocked(mockJsonWriter.get).mockReturnValue(deployments);

    const port = handleSubdomain('test1');
    expect(port).toBe(3001);

    const missingPort = handleSubdomain('nonexistent');
    expect(missingPort).toBeUndefined();
  });

  it('should proxy requests to correct ports', async () => {
    const deployments = [
      { domain: 'test1', port: 3001 },
      { domain: 'test2', port: 3002 }
    ];

    vi.mocked(mockJsonWriter.get).mockReturnValue(deployments);

    // Mock the proxy middleware
    const mockProxy = vi.fn();
    vi.mock('http-proxy', () => ({
      createProxyServer: () => ({
        web: mockProxy
      })
    }));

    // Test proxying a request
    const mockReq = {
      headers: { host: 'test1.local' },
      url: '/api/test',
      method: 'GET'
    };

    const mockRes = {};

    await app.handle(mockReq, mockRes);

    expect(mockProxy).toHaveBeenCalled();
  });
});
