import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
import * as net from 'net';
import { GroupBuilder } from '@custom-express/better-standard-library';
import { z } from 'zod';

const git = simpleGit();

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


/**
 * Clones the repo, checks out specific commit, and builds Docker image.
 */

async function cloneRepo(v:{
  repoUrl: string,
  branch: string,
  commitId: string,
  localPath: string,
}){

  const {localPath, repoUrl, branch, commitId } = v
  if (!fs.existsSync(localPath)) {
    console.log(`[INFO] Cloning '${branch}' from '${repoUrl}'...`);
    await git.clone(repoUrl, localPath, ['--branch', branch, '--single-branch']);
  }

  await git.cwd(localPath).fetch();
  await git.cwd(localPath).checkout(commitId);

}

async function buildDockerImage(v: {
  name: string, 
  dockerfile: string,
  localPath: string
}) {
  const {dockerfile, localPath, name} = v

  const buildCommand = `docker build -f ${dockerfile} -t ${name} ${localPath}`;
  await Exec(buildCommand)
}


async function Exec(command: string){

  await new Promise<void>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`[ERROR] Docker build failed:\n${stderr}`);
        return reject(err);
      }
      console.log(stdout);
      resolve();
    });
  });

}

const dockerGroup = new GroupBuilder([], z.object({
  repoUrl: z.string(),
  branch: z.string(), 
  commitId: z.string(), 
  localPath: z.string(),
  port: z.number() 
})
)

export async function buildFromCommit(v: {
  repoUrl: string,
  branch: string,
  commitId: string,
  localPath: string,
  port:number 
}): Promise<void> {
  const {localPath, repoUrl, branch, commitId, port} = v
  const dockerfile = path.join(localPath, 'Dockerfile');
  if (!fs.existsSync(dockerfile)) {
    throw new Error(`[ERROR] Dockerfile not found at: ${dockerfile}`);
  }
  cloneRepo(v)
  buildDockerImage({
    localPath,
    name: commitId,
    dockerfile: dockerfile,

  })
  
  const dockerfileContent = fs.readFileSync(dockerfile, 'utf-8');

  const exposeMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/);
  if (!exposeMatch) {
    throw new Error(`[ERROR] No EXPOSE directive found in Dockerfile`);
  }

  const containerPort = exposeMatch[1];
  const runCommand = `docker run -d -p ${port}:${containerPort} ${commitId}`;

  console.log(`[INFO] Running: ${runCommand}`);
  await new Promise<void>((resolve, reject) => {
    exec(runCommand, (err, stdout, stderr) => {
      if (err) {
        console.error(`[ERROR] Docker run failed:\n${stderr}`);
        return reject(err);
      }
      console.log(stdout);
      resolve();
    });
  });

  console.log(`[SUCCESS] Built and started Docker image '${commitId}' from commit '${commitId}'`);
}
