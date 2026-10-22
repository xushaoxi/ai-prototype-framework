import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', fullyParallel:false, workers:1, timeout:30000,
  expect:{timeout:10000}, reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome'],...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),viewport:{width:1440,height:1000}}}],
  webServer:{command:'npm run build && npm run preview',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:90000},
});
