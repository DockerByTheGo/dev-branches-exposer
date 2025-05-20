import { Elysia } from 'elysia';
import { type PushEvent, type PullRequestEvent } from '@octokit/webhooks-types';
import config from "./config"
import { randomUUIDv7 } from 'bun';
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

    runYourHandler({
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

      runYourHandler({
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

function getCurrentDeployments(): string[] {
    return []
}

function deploy(dockerfile: string){
    while (true) {
        const subdomain  = randomUUIDv7();
        subdomain.slice(0,12)
        if(getCurrentDeployments().indexOf(subdomain) > -1){ // e.g. it is not already in use
            // deploy
            break 
        }
    }
}

function runYourHandler(data: {
  type: 'push' | 'merge',
  branch: string,
  commit: { id: string; message: string },
  rawEvent: any
}) {
    config()
  console.log(`📦 Event Type: ${data.type}`);
  console.log(`🔀 Branch: ${data.branch}`);
  console.log(`📝 Commit: ${data.commit.id} - ${data.commit.message}`);

}

app.listen(3000);
console.log('🚀 Listening for GitHub events at http://localhost:3000/git-webhook');
