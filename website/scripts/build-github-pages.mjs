import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const 目前檔案 = fileURLToPath(import.meta.url);
const 網站根目錄 = join(dirname(目前檔案), "..");
const 輸出目錄 = join(網站根目錄, "out");
const 靜態來源目錄 = join(網站根目錄, "static-pages");
const 公開資源目錄 = join(網站根目錄, "public");

await rm(輸出目錄, { recursive: true, force: true });
await mkdir(輸出目錄, { recursive: true });

const 原始樣式 = await readFile(join(網站根目錄, "app", "globals.css"), "utf8");
const 靜態樣式 = 原始樣式
  .replace('@import "tailwindcss";', "")
  .replace("background-image: var(--主視覺圖片);", 'background-image: url("og.jpg");');

await copyFile(join(靜態來源目錄, "index.html"), join(輸出目錄, "index.html"));
await writeFile(join(輸出目錄, "styles.css"), 靜態樣式);
await copyFile(join(公開資源目錄, "og.jpg"), join(輸出目錄, "og.jpg"));
await copyFile(join(公開資源目錄, "favicon.svg"), join(輸出目錄, "favicon.svg"));
await writeFile(join(輸出目錄, ".nojekyll"), "");

console.log("GitHub Pages 靜態網站已輸出到 website/out");
