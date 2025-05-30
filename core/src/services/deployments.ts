import { z } from "zod"
import { g, JsonWriter, SimpleJSONWriter } from "../internals/json-writer/main"
import config from "../../config"
import { buildFromCommit, getFreePort } from "../internals/docker/build"
import { repoUrl } from "../../metadata"
import type { DeploymentInstance } from "../scehams-and-types/main"
import { expect } from "bun:test"
import { showStoppedContainerPorts_exec } from "../internals/docker/inspectConatiners"
import { promisify } from 'util';
import { exec } from "child_process"

 const execAsync = promisify(exec);

class Deployment {
    private stateWriter = g;

    /**
     * Change the domain (subdomain) for a deployment
     * @param oldDomain - the current domain to change
     * @param newDomain - the new domain to set
     * @returns true if changed, false if not found or already exists
     */
    changeDomain(oldDomain: string, newDomain: string): boolean {
        const deployments = this.stateWriter.get().deployments;
        if (deployments.some(d => d.domain === newDomain)) return false; // newDomain already exists
        const idx = deployments.findIndex(d => d.domain === oldDomain);
        if (idx === -1) return false;
        this.stateWriter.modify(v => {
            const newDeployments = [...v.deployments];
            newDeployments[idx] = { ...newDeployments[idx], domain: newDomain };
            return { ...v, deployments: newDeployments };
        });
        return true;
    }

    /**
     * Remove a deployment by domain
     * @param domain - the domain to remove
     * @returns true if removed, false if not found
     */
    removeDeployment(domain: string): boolean {
        const deployments = this.stateWriter.get().deployments;
        const idx = deployments.findIndex(d => d.domain === domain);
        if (idx === -1) return false;
        this.stateWriter.modify(v => {
            return { ...v, deployments: v.deployments.filter(d => d.domain !== domain) };
        });
        return true;
    }
    private stateWriter = g
    
constructor() {
    this.recoverDeployments(); 
  }

  private async recoverDeployments() {
    try {
      const deployments = await showStoppedContainerPorts_exec();

      for (const deployment of this.stateWriter.get().deployments) {
        const match = deployments.find(v => v.image === deployment.domain);
        if (!match) continue;

        const runCommand = `docker start ${match.name}`;
        console.log(`[INFO] Running: ${runCommand}`);

        try {
          const { stdout } = await execAsync(runCommand);
          console.log(`[SUCCESS] ${match.name} started:\n${stdout}`);
        } catch (err: any) {
          console.error(`[ERROR] Docker start failed for ${match.name}:\n${err.stderr || err.message}`);
        }
      }
    } catch (err: any) {
      console.error(`[ERROR] Failed to recover deployments:\n${err.message}`);
    }
  }
    
    async deploy(info: {branch: string, commitId: string, domain: string}){
        const freePort = await getFreePort();
        
        buildFromCommit({
            repoUrl: repoUrl,
            branch: info.branch,
            commitId: info.commitId,
            localPath: "./testing-deploys",
            port: freePort
        });
        this.stateWriter.modify(v => {
            return {
                deployments: [...v["deployments"], {domain: info.domain ,port: freePort, dockerimage: info.commitId}]
            }
        })

    }
    getDeployments(): Record<string, DeploymentInstance> {
        return this.stateWriter
        .get().deployments
        .reduce((prev, curr) => {
            return {
                ...prev,
                [curr.domain]: curr
            }
        },{} as Record<string, DeploymentInstance>)
    }
    
}

export const deploymentService = new Deployment()
// Expose new methods for use in server/main.ts or elsewhere
export const changeDeploymentDomain = (
    oldDomain: string,
    newDomain: string
) => deploymentService.changeDomain(oldDomain, newDomain);

export const removeDeployment = (
    domain: string
) => deploymentService.removeDeployment(domain);

// deploymentService.deploy({
//   "branch": "master",
//   "commitId": "aee9cee02eeb6f9ef3115a0c8fc4148e21bd729c",
// })