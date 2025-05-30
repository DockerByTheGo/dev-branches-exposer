import config from "../config";
import { deploymentService } from "./services/deployments";

export function handleWebhook(data: {
  type: 'push' | 'merge',
  branch: string,
  commit: { id: string; message: string },
  rawEvent: any
}) {
    config({branchName: data.branch})  
    .ifCanBeUnpacked(val =>
      deploymentService.deploy({branch: data.branch,commitId: data.commit.id, domain: val})
    ) 

}