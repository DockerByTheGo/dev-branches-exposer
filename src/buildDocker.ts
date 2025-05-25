import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';

const git = simpleGit();

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

  const buildCommand = `docker build -f ${dockerfile} -t ${dockerTag} ${localPath}`;

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
