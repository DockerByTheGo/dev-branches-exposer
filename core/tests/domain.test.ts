import { describe, it, expect, vi } from 'vitest';
import { generateDomain } from '../src/services/domain';
import { JsonWriter } from '../src/internals/json-writer/main';

// Mock the JsonWriter
vi.mock('../src/internals/json-writer/main');

const mockJsonWriter = {
  get: vi.fn().mockReturnValue([])
};

vi.mocked(JsonWriter).new.mockReturnValue(mockJsonWriter);

describe('Domain Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate unique domains', () => {
    const domain1 = generateDomain();
    const domain2 = generateDomain();

    expect(domain1).not.toEqual(domain2);
    expect(domain1).toHaveLength(10);
    expect(domain2).toHaveLength(10);
  });

  it('should handle existing domains', () => {
    const existingDomain = 'test-domain';
    vi.mocked(mockJsonWriter.get).mockReturnValue([
      { domain: existingDomain, port: 3000 }
    ]);

    const generatedDomain = generateDomain();
    expect(generatedDomain).not.toEqual(existingDomain);
  });
});
