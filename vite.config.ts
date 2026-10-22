import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 15000 },
  build: { rolldownOptions: { output: { codeSplitting: { groups: [ {name:'react',test:/node_modules\/(react|react-dom|scheduler)\//,priority:30}, {name:'antd',test:/node_modules\/(antd|@ant-design|@rc-component|rc-)/,priority:20,maxSize:450000} ] } } } },
});
