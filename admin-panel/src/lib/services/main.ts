import { requestFormReset } from "react-dom";
import type { DeploymentInstance } from "../../../../core/src/scehams-and-types/main";
import {  API } from "../api";
import { objectEntries } from "@blazyts/better-standard-library";

export class Deployments {
    static getDeployments(): DeploymentInstance[]{
        return [{domain: "jjj", port: 5000}]
    }

    static changeDeployment(oldDeployment: DeploymentInstance, newDeployment: DeploymentInstance) {
        API.admin["change-domain"].post({
            domain: oldDeployment.domain,
            newDomain: newDeployment.domain
        })
    } 

    static remove(deployment: DeploymentInstance) {
        API.admin["remove-deployment"].post({
            domain: deployment.domain
        })
    }
}


type Router = string
type Route = string



type RouteDefinition<T> = T

type EdenTreaty<T extends Record<Router, Record<Route, RouteDefinition<any>>>> = T

type TransformedEden<T extends Record<Router, Record<Route, RouteDefinition<any>>>> = {
    [Router in keyof T]:{
        [Route in keyof T[Router]]: T[Router][Route]["post"]
    }
} 

function transform<T extends Record<string, Record<string, {
    post: unknown
}>>>(params: T): TransformedEden<T> {
    const r = {} as TransformedEden<T>
    
    Object.entries(params).forEach(([routerName, router]) => {
        r[routerName as keyof T] = {} as any
        
        Object.entries(router).forEach(([routeName, route]) => {
            r[routerName as keyof T][routeName as keyof T[keyof T]] = route.post
        })
    })
    
    return r
}

// const transformed = transform(API)
export const Services = transform(API)

type ReactifiedEden<T extends TransformedEden<Record<string, Record<string, { post: unknown }>>>> = {
  [Router in keyof T]: {
    [Route in keyof T[Router]]: (args: Parameters<T[Router][Route]>) => () => UseQueryResult<Awaited<ReturnType<T[Router][Route]>>>
  }
}

function reactify<T extends TransformedEden<Record<string, Record<string, { post: unknown }>>>>(
  v: T
): ReactifiedEden<T> {
  const result = {} as ReactifiedEden<T>

  for (const routerName in v) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    result[routerName] = {} as any

    for (const routeName in v[routerName]) {
      const postFn = v[routerName][routeName]

      result[routerName][routeName] = (args: ReturnType<typeof postFn>) => {
        return () =>
          useQuery({
            queryKey: [routerName, routeName, args],
            queryFn: () => postFn(args),
          })
      }
    }
  }

  return result
}


// export const Services = reactify(transformed)
// Example usage 
// jj.admin["change-domain"]([{"domain": "kode", "newDomain":"j"}])

const deployments = API.admin["change-domain"]