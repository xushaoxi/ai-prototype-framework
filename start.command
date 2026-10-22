#!/bin/bash
set -eu
cd "$(dirname "$0")"
compatible_node() {
  "$1" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===20&&b>=19)||(a===22&&b>=12)||a>22?0:1)' >/dev/null 2>&1
}
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ] || ! compatible_node "$node_bin"; then
  node_bin=""
  # Use existing nvm installations only; no shell profile, global switch or download.
  for candidate in "${NVM_DIR:-$HOME/.nvm}"/versions/node/v*/bin/node; do
    if [ -x "$candidate" ] && compatible_node "$candidate"; then
      node_bin="$candidate"
      break
    fi
  done
fi
if [ -z "$node_bin" ]; then
  echo '未找到兼容 Node。请先安装 Node 20.19+ 的 20.x，或 22.12+，然后重新启动。'
  exit 1
fi
export PATH="$(dirname "$node_bin"):$PATH"
echo "使用 Node $(node --version)：$node_bin"
if [ ! -d node_modules ]; then
  echo '首次启动请先在本目录执行 npm ci，然后重新双击 start.command。'
  exit 1
fi
exec npm run dev
