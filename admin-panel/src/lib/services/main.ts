import { requestFormReset } from "react-dom";
import type { DeploymentInstance } from "../../../../core/src/scehams-and-types/main";

export class Deployments {
    static getDeployments(): DeploymentInstance[]{
        return [{domain: "jjj", port: 5000}]
    }

    static changeDeployment(oldDeployment: DeploymentInstance, newDeployment: DeploymentInstance) {
        API.admin["change-domain"].post({
            domain: oldDeployment.domain,
            newDomain: newDeployment.domain
        })
    } 

    static remove(deployment: DeploymentInstance) {
        API.admin["remove-deployment"].post({
            domain: deployment.domain
        })
    }
}