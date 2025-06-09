import { Optionable } from "@blazyts/better-standard-library";
import { randomUUIDv7 } from "bun";

export default function config(v: {
    branchName: string
}): Optionable<string>{
    if(v.branchName === "main"){
        return new Optionable("main." + randomUUIDv7().slice(0,10))
    }
    return new Optionable<string>(null)
}

