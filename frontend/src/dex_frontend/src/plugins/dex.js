import { dex } from "../lib/dex";

export default {
  install(app) {
    app.config.globalProperties.$dex = dex;
    app.provide("dex", dex);
  },
};
