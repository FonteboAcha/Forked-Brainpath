import { defaultCache } from "@serwist/vite/worker";
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // defaultCache covers the app shell. Add BrainPath-specific caching
  // strategies (e.g. CacheFirst for downloaded lesson videos, NetworkFirst
  // for /api/* calls) here as those features get built.
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
