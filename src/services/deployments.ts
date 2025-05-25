import { JsonWriter } from "../internals/json-writer/main"

interface DeploymentInstance {
    name: string,
    dockerImgName: string
}

interface IDeployment {
    deploy(info: DeploymentInstance): void
    getDeployments(): Record<string, DeploymentInstance>
    removeDeployment(name: DeploymentInstance["name"]): void
}
class DeploymentConfigWriter extends JsonWriter<Record<string, DeploymentInstance>,"ff.json"> {}

class Deployment implements IDeployment {
    private stateWriter: DeploymentConfigWriter
    constructor(){
        this.stateWriter =  DeploymentConfigWriter.new("./ff.json")
    }
    
    
    deploy(info: DeploymentInstance): void {
        this.stateWriter.create({
            [info.name]: info
        })
    }
    getDeployments(): Record<string, DeploymentInstance> {
        return this.stateWriter.getAll()
    }
    removeDeployment(name: DeploymentInstance["name"]): void {
        this.stateWriter.delete({
            name
        })
    }
    
}