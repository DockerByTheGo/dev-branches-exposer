import { randomUUIDv7 } from "bun";
import { g } from "../internals/json-writer/main";


export function generateDomain(): string {
        while (true) {
            const newDomain = randomUUIDv7().slice(0,10)
            if(! g.get().deployments.find(v => v.domain === newDomain)){
                return newDomain
            }
        }
    }
