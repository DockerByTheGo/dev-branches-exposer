import { Elysia } from 'elysia';
import { type PushEvent, type PullRequestEvent } from '@octokit/webhooks-types';
import config from "../../config"
import { randomUUIDv7 } from 'bun';
import { deploymentService } from '../services/deployments';
const app = new Elysia();



app.post('/git-webhook', async ({ request, body }) => {
  const eventType = request.headers.get('x-github-event');

  if (!eventType) {
    console.warn('Missing GitHub event header');
    return new Response(null, { status: 400 });
  }

  if (eventType === 'push') {
    const payload = body as PushEvent;
    const lastCommit = payload.commits[payload.commits.length - 1];

    handleWebhook({
      type: 'push',
      branch: payload.ref.replace('refs/heads/', ''),
      commit: lastCommit,
      rawEvent: payload
    });

  } else if (eventType === 'pull_request') {
    const payload = body as PullRequestEvent;

    // Only act on successful merges
    if (payload.action === 'closed' && payload.pull_request.merged) {
      const lastCommitSha = payload.pull_request.merge_commit_sha;

      handleWebhook({
        type: 'merge',
        branch: payload.pull_request.base.ref,
        commit: {
          id: lastCommitSha,
          message: payload.pull_request.title,
        },
        rawEvent: payload
      });
    }
  }

  return new Response(null, { status: 200 });
});

function handleWebhook(data: {
  type: 'push' | 'merge',
  branch: string,
  commit: { id: string; message: string },
  rawEvent: any
}) {
    config()
    deploymentService.deploy({
      name: data.commit.message,
      dockerImage
    }) 

}

app.listen(3000);
