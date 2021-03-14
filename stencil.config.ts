import { Config } from "@stencil/core";
import { readFileSync } from "fs";
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
  devServer: {
    // https: {
    //   cert: readFileSync("dev.crt", "utf8"),
    //   key: readFileSync("dev.key", "utf8"),
    // },
  },
};
