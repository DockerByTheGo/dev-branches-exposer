import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deploymentService } from '../src/services/deployments';
import { DeploymentInstance } from '../src/scehams-and-types/main';
import { JsonWriter } from '../src/internals/json-writer/main';

// Mock the JsonWriter
vi.mock('../src/internals/json-writer/main');

const mockJsonWriter = {
  modify: vi.fn(),
  get: vi.fn().mockReturnValue([])
};

vi.mocked(JsonWriter).new.mockReturnValue(mockJsonWriter);

describe('Deployment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deploy a new service', async () => {
    const info = {
      branch: 'test-branch',
      commitId: 'test-commit',
      domain: 'test-domain'
    };

    const freePort = 3001;
    vi.mocked(getFreePort).mockResolvedValue(freePort);

    await deploymentService.deploy(info);

    expect(mockJsonWriter.modify).toHaveBeenCalledWith(
      expect.any(Function)
    );

    const deployments = mockJsonWriter.get();
    expect(deployments).toContainEqual(
      expect.objectContaining({
        domain: info.domain,
        port: freePort
      } as DeploymentInstance)
    );
  });

  it('should get deployments', () => {
    const deployment: DeploymentInstance = {
      domain: 'test-domain',
      port: 3001
    };

    vi.mocked(mockJsonWriter.get).mockReturnValue([deployment]);

    const result = deploymentService.getDeployments();
    expect(result).toHaveProperty(deployment.domain, deployment);
  });
});
