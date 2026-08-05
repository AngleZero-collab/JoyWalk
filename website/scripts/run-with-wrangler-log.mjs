import { spawn } from "node:child_process";

const 執行指令 = process.argv[2];
const 指令參數 = process.argv.slice(3);

if (!執行指令) {
  console.error("請提供要執行的網站指令。");
  process.exit(1);
}

const 環境變數 = {
  ...process.env,
  WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? ".wrangler/wrangler.log",
};

const 正規化指令 = 執行指令 === "node" ? process.execPath : 執行指令;

const 子程序 = spawn(正規化指令, 指令參數, {
  stdio: "inherit",
  env: 環境變數,
});

子程序.on("exit", (結束代碼) => {
  process.exit(結束代碼 ?? 1);
});

子程序.on("error", (錯誤) => {
  console.error(`網站指令執行失敗：${錯誤.message}`);
  process.exit(1);
});
