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

// const group = new GroupBuilder([], z.object({ // remake all the docker function bs with this composer so that you pass the funcs only once
//   repoUrl: z.string(),
//   branch: z.string(), 
//   commitId: z.string(), 
//   localPath: z.string(),
//   port: z.number() 
// }))
//     .addFunc((state) => {
//         state.dockerImage = "dockerImage";
//     })
//     .addFunc((state) => {
//         state.port = 1;
//     })
//     .build();

export async function runContainer(v: {
  port: number,
  containerPort: string,
  name: string
}) {
  const {port, containerPort, name} = v;
  Exec(`docker run -d -p ${port}:${containerPort} ${name}`)
}

export async function buildFromCommit(v: {
  repoUrl: string,
  branch: string,
  commitId: string,
  localPath: string,
  port: number 
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
    dockerfile: dockerfile
  })
  
  const dockerfileContent = fs.readFileSync(dockerfile, 'utf-8');

  const exposeMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/);
  if (!exposeMatch) {
    throw new Error(`[ERROR] No EXPOSE directive found in Dockerfile`);
  }

  const containerPort = exposeMatch[1];
  runContainer({
    port,
    containerPort,
    name: commitId
  })
  
  console.log(`[SUCCESS] Built and started Docker image '${commitId}' from commit '${commitId}'`);
}
