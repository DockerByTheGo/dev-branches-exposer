import { z } from "zod"
import { g, JsonWriter, SimpleJSONWriter } from "../internals/json-writer/main"
import config from "../../config"
import {SharedProperties} from "@custom-express/better-standard-library"
import { buildFromCommit, getFreePort } from "../buildDocker"
import { repoUrl } from "../../metadata"
import type { DeploymentInstance } from "../scehams-and-types/main"



 

class Deployment {
    private stateWriter = g
    
    
    async deploy(info: {branch: string, commitId: string}){
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
                deployments: [...v["deployments"], {domain: info.commitId,port: freePort }]
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
deploymentService.deploy({
  "branch": "master",
  "commitId": "aee9cee02eeb6f9ef3115a0c8fc4148e21bd729c",
})