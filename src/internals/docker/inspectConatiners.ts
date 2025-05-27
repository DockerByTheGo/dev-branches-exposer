import { AnotherSmartString } from '@custom-express/better-standard-library';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const a = {
  host: (v: string) => v.slice(v.indexOf(":"), v.indexOf(" ")),
  container: (v: string) => v.slice(v.indexOf(">") + 1, v.indexOf("/"))
};

class SmartPort extends AnotherSmartString.V1<typeof a> {
  constructor(v: string) {
    super(a, v);
  }
}

interface ContainerPortInfo {
  name: string;
  image: string;
  ports: SmartPort;
}

export async function showStoppedContainerPorts_exec(): Promise<ContainerPortInfo[]> {
  try {
    const { stdout: idsRaw } = await execAsync('docker ps -a -q');
    const ids = idsRaw.trim().split('\n').filter(Boolean);
    const results: ContainerPortInfo[] = [];

    for (const id of ids) {
      const { stdout: inspectRaw } = await execAsync(`docker inspect ${id}`);
      const info = JSON.parse(inspectRaw)[0];

      const state = info?.State?.Status;
      if (state !== 'exited' && state !== 'created') continue;

      const name = info?.Name?.replace(/^\//, '') || id;
      const image = info?.Config?.Image || 'unknown';
      const bindings = info?.HostConfig?.PortBindings || {};

      const ports = Object.entries(bindings).map(([containerPort, bindings]) => {
        const mapped = (bindings || []).map((b: any) =>
          `${b.HostIp || '0.0.0.0'}:${b.HostPort} -> ${containerPort}`
        ).join(', ');
        return mapped || `${containerPort} (not published)`;
      });

      console.log(`${name} (stopped):`);
      console.log(`  Image: ${image}`);
      console.log(ports.length ? `  Ports: ${ports.join(', ')}` : '  No exposed ports.');

      results.push({
        name,
        image,
        ports: new SmartPort(`Ports: ${ports.join(', ')}`)
      });
    }

    return results;
  } catch (err: any) {
    throw new Error(`Error: ${err.message}`);
  }
}
