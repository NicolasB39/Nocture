// Navigateur des outils et des tests de bout en bout : le Chromium de Playwright, ou celui que PW_CHANNEL désigne
// (chrome, msedge) ; sans le Chromium de Playwright, le Chrome installé.
import { chromium } from 'playwright';

export const launch = () =>
  chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}).catch(() => chromium.launch({ channel: 'chrome' }));
