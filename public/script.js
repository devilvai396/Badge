import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";
import { mountBadge } from "./Badge-ui.js";

window.addEventListener("load", async () => {
  const $root = document.getElementById("app");
  const $status = document.getElementById("status");

  const env = { isMini: false, label: "Web" };
  try {
    env.isMini = await sdk.isInMiniApp();
    env.label = env.isMini ? "Mini App" : "Web";
  } catch (e) {
    env.isMini = false;
    env.label = "Web";
  }

  $status.textContent = env.isMini
    ? "Running inside Farcaster / Base Mini App"
    : "Running on the open web (Mini App-ready)";

  mountBadge($root, env);

  try {
    await sdk.actions.ready();
  } catch (e) {}
});
