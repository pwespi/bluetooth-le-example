import { Config } from "@stencil/core";
import { nodeResolve } from "@rollup/plugin-node-resolve";

// https://stenciljs.com/docs/config

export const config: Config = {
  globalScript: "src/global/app.ts",
  globalStyle: "src/global/app.css",
  taskQueue: "async",
  outputTargets: [
    {
      type: "www",
      serviceWorker: null,
    },
  ],
  rollupPlugins: {
    before: [
      // required by uvu
      nodeResolve(),
    ],
  },
};
