import { z } from "zod"
import { g, JsonWriter, SimpleJSONWriter } from "../internals/json-writer/main"
import { buildFromLatestCommit } from "../buildDocker"
import config from "../../config"
export const DeploymentInstanceSchema = z.object({
    name: z.string().nonempty(),
    dockerImage: z.string().nonempty(),
    domain: z.string().nonempty()
})

export const DeploymentsJson = z.object({
    deployments: z.array(DeploymentInstanceSchema)
}) 
export type DeploymentInstance = z.infer<typeof DeploymentInstanceSchema> 

 

class Deployment {
    private stateWriter = g
    
    
    deploy(info: ): void {
        buildFromLatestCommit({
            repoUrl: info.
        })
        this.stateWriter.modify(v => {
            return {
                deployments: [...v["deployments"], info]
            }
        })

    }
    getDeployments(): Record<string, DeploymentInstance> {
        return this.stateWriter
        .get().deployments
        .reduce((prev, curr) => {
            return {
                ...prev,
                [curr.name]: curr
            }
        },{} as Record<string, DeploymentInstance>)
    }
    
    removeDeployment(name: DeploymentInstance["name"]): void {
        this.stateWriter
    }
    
}

export const deploymentService = new Deployment()