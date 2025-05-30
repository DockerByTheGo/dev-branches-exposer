import { createNextApiHandler } from "@trpc/server/adapters/next";

import { env } from "admin-panel/env";
import { appRouter } from "admin-panel/server/api/root";
import { createTRPCContext } from "admin-panel/server/api/trpc";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
          );
        }
      : undefined,
});
