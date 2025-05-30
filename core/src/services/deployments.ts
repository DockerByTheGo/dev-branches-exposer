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
    private stateWriter = g
    
constructor() {
    this.recoverDeployments(); // call the async method
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
// deploymentService.deploy({
//   "branch": "master",
//   "commitId": "aee9cee02eeb6f9ef3115a0c8fc4148e21bd729c",
// })