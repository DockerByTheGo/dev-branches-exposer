import { describe, it, expect, vi } from 'vitest';
import { handleWebhook } from '../src/server/main';
import { config } from '../config';
import { Optionable } from '@custom-express/better-standard-library';

// Mock the config
vi.mock('../config', () => ({
  config: vi.fn()
}));

describe('Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle push event for main branch', () => {
    const data = {
      type: 'push',
      branch: 'main',
      commit: { id: 'test-commit', message: 'test commit' },
      rawEvent: {}
    };

    vi.mocked(config).mockReturnValue(new Optionable('main.test-domain'));

    handleWebhook(data);

    expect(config).toHaveBeenCalledWith({ branchName: 'main' });
  });

  it('should skip non-main branches', () => {
    const data = {
      type: 'push',
      branch: 'feature-branch',
      commit: { id: 'test-commit', message: 'test commit' },
      rawEvent: {}
    };

    vi.mocked(config).mockReturnValue(new Optionable(null));

    handleWebhook(data);

    expect(config).toHaveBeenCalledWith({ branchName: 'feature-branch' });
  });
});
