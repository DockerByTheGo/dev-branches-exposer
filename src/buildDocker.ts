import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
import * as net from 'net';

const git = simpleGit();

/*
i would rather not open a connection 
ChatGPT said:

Got it — if you want to find a free port without opening a socket, there's no 100% reliable way to guarantee it's free at the moment of actual use, because another process could bind to it right after your check.

But if you still want a "best-effort" solution without opening a connection, here’s a function that:

    Gets all used ports from ss -tuln

    Picks a random unused port from a specified range (default: 1024–65535)

⚠️ Caveat

    This is inherently race-prone — a port that's free now may be taken milliseconds later. Use this only if you cannot open a socket, and race conditions are acceptable.

! thats why we open a port 
*/
export function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address?.port) {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close();
        reject(new Error('Could not determine free port'));
      }
    });

    server.on('error', reject);
  });
}

interface BuildDockerOptions {
  repoUrl: string;
  branch: string;
  localPath: string;
  dockerTag: string; // e.g., "my-image:latest"
  dockerfilePath?: string; // default is Dockerfile in root
}

/**
 * Pulls latest commit from a branch and builds the Dockerfile inside it.
 */
export async function buildFromLatestCommit({
  repoUrl,
  branch,
  localPath,
  dockerTag,
  dockerfilePath,
}: BuildDockerOptions): Promise<void> {
  // Clone or pull the latest commit
  if (fs.existsSync(localPath)) {
    console.log(`[INFO] Repository exists. Pulling latest from '${branch}'...`);
    await git.cwd(localPath).checkout(branch);
    await git.cwd(localPath).pull('origin', branch);
  } else {
    console.log(`[INFO] Cloning '${branch}' from '${repoUrl}'...`);
    await git.clone(repoUrl, localPath, ['--branch', branch, '--single-branch']);
  }

  const dockerfile = dockerfilePath || path.join(localPath, 'Dockerfile');
  if (!fs.existsSync(dockerfile)) {
    throw new Error(`[ERROR] Dockerfile not found at: ${dockerfile}`);
  }

  const dockerfileContent = fs.readFileSync("Dockerfile").toLocaleString()
  const port = dockerfileContent.slice(
    dockerfileContent.indexOf("EXPOSE")+("EXPOSE").length,
     dockerfileContent.slice(dockerfileContent.indexOf("EXPOSE")).indexOf("/n")
    )

  
  const freePort = await getFreePort() 
  const buildCommand = `docker build -f ${dockerfile} -t ${dockerTag} -p ${freePort}:${port} ${localPath}`;

  console.log(`[INFO] Running: ${buildCommand}`);
  await new Promise<void>((resolve, reject) => {
    exec(buildCommand, (err, stdout, stderr) => {
      if (err) {
        console.error(`[ERROR] Docker build failed:\n${stderr}`);
        return reject(err);
      }
      console.log(stdout);
      resolve();
    });
  });

  console.log(`[SUCCESS] Built Docker image '${dockerTag}' from branch '${branch}'`);
}
