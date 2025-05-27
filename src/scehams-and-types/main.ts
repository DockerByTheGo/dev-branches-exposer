import { z } from "zod"

export const DeploymentInstanceSchema = z.object({
    domain: z.string().nonempty(),
    port: z.number().nonnegative()
})

export const DeploymentsJson = z.object({
    deployments: z.array(DeploymentInstanceSchema)
}) 
export type DeploymentInstance = z.infer<typeof DeploymentInstanceSchema> 

