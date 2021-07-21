import { createLogger, html } from "https://deno.land/x/surv@v0.2.5/mod.ts";
import { cli } from "https://deno.land/x/surv@v0.2.5/cli.ts";

if (import.meta.main) {
  await cli({
    tsconfig: "tsconfig.json",
    server: "https://deno.land/x/surv@v0.2.5/serve.ts",
    build: [{
      cmd: ["deno", "run", "-A", "https://deno.land/x/edcb@v0.5.1/cli.ts"],
    }],
    modules: {
      index: "./index.tsx",
    },
    pages: {
      index: html({
        // TODO(surv): Replace with website title.
        title: "Your Website",
        modules: ["./index.js"],
      }),
    },
    logger: createLogger({
      // TODO(surv): Replace with name of CLI.
      name: "your website cli",
    }),
  });
}
