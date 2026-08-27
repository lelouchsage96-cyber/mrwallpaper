import { ONBOARDING_KEY, THEME_KEY } from "./storage-keys";

/**
 * Runs in <head> before first paint: apply stored theme, and skip the splash
 * on returning visits so `/` never flashes the mark then jumps to Home.
 */
export const BOOT_SCRIPT = `!function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)}),d=t==="light"?!1:t==="system"?matchMedia("(prefers-color-scheme:dark)").matches:!0,e=document.documentElement;e.classList.toggle("dark",d);e.classList.toggle("light",!d);e.style.colorScheme=d?"dark":"light";if(location.pathname==="/"&&localStorage.getItem(${JSON.stringify(ONBOARDING_KEY)})==="1")location.replace("/app")}catch(n){}}();`;
