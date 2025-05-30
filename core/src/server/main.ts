import { Elysia } from "elysia";
import { type PushEvent, type PullRequestEvent } from "@octokit/webhooks-types";
import config from "../../config";
import { randomUUIDv7 } from "bun";
import { deploymentService } from "../services/deployments";
import { handleWebhook } from "../handleGithubWebhook";
import { OneOf, Try } from "@custom-express/better-standard-library";

const app = new Elysia();

function isMergeSuccessful(payload: any) {
  return payload.action === "closed" && payload.pull_request.merged;
}

app.post("/git-webhook", async ({ request, body }) => {
  const eventType = request.headers.get("x-github-event");

  if (!eventType) {
    console.warn("Missing GitHub event header");
  }

  return Try(eventType as "push" | "pull_request", {
    ifNone: () => {
      return new Response(null, { status: 400 });
    },
    ifNotNone: (v: "push" | "pull_request") => {
      switch (v) {
        case "pull_request":
          const payload = body as PullRequestEvent;

          // Only act on successful merges
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
          break;
        
        case "push":
              const payload = body as PushEvent;
    const lastCommit = payload.commits[payload.commits.length - 1];

    handleWebhook({
      type: "push",
      branch: payload.ref.replace("refs/heads/", ""),
      commit: lastCommit,
      rawEvent: payload,
    });
      }
    },
  });

  if (eventType === "push") {
  } else if (eventType === "pull_request") {
  }

  return new Response(null, { status: 200 });
});

app.listen(5000);
