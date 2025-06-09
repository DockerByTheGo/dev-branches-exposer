
import { treaty } from "@elysiajs/eden";
import { Elysia, t } from "elysia";
import { type PushEvent, type PullRequestEvent } from "@octokit/webhooks-types";
import config from "../../config";
import { randomUUIDv7 } from "bun";
import { deploymentService } from "../services/deployments";
import { OneOf, Try } from "@blazyts/better-standard-library";
import { match } from "ts-pattern";
import { handleWebhook } from "../internals/handleGithubWebhook";
import swagger from "@elysiajs/swagger";
function isMergeSuccessful(payload: any) {
  return payload.action === "closed" && payload.pull_request.merged;
}

export const app = new Elysia()
    .use(swagger())
.post("/git-webhook/invoke", async ({ request, body }) => {
  const eventType = request.headers.get("x-github-event");

  if (!eventType) {
    console.warn("Missing GitHub event header");
  }

  return Try(eventType as "push" | "pull_request", {
    ifNone: () => {
      return new Response(null, { status: 400 });
    },
    ifNotNone: (v: "push" | "pull_request") => {
      match(v)
        .with("pull_request", () => {
          const payload = body as PullRequestEvent;

          if (isMergeSuccessful(payload)) {
            const lastCommitSha = payload.pull_request.merge_commit_sha;

            handleWebhook({
              type: "merge",
              branch: payload.pull_request.base.ref,
              commit: {
                id: lastCommitSha,
                message: payload.pull_request.title,
              },
              rawEvent: payload,
            });
          }
        })
        .with("push", () => {
          const payload = body as PushEvent;
          const lastCommit = payload.commits[payload.commits.length - 1];

          handleWebhook({
            type: "push",
            branch: payload.ref.replace("refs/heads/", ""),
            commit: lastCommit,
            rawEvent: payload,
          });
        })
        .otherwise(() => {
          // Optionally handle unknown event types
        });
      return new Response(null, { status: 200 });
    },
  });


})
.post("/admin/change-domain", async ({ body }) => {
  const { domain, newDomain } = body;
  const changed = deploymentService.changeDomain(domain, newDomain);
  if (changed) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ success: false, error: "Domain not found or new domain already exists" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
},{
    body: t.Object({
        domain: t.String(),
        newDomain: t.String()
    })
})
.post("/admin/remove-deployment", async ({ body }) => {
  const { domain } = body;
  if (!domain) {
    return new Response(JSON.stringify({ success: false, error: "Missing domain parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const removed = deploymentService.removeDeployment(domain);
  if (removed) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ success: false, error: "Domain not found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}, {
    body: t.Object({
        domain: t.String()
    })
})
.post("/admin/getDeployments", async () =>{
  return new Response(JSON.stringify(deploymentService.getDeployments()))
})

export const client = treaty<typeof app>("loca")