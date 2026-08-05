# SafeStride 安行公開展示網站

這是 SafeStride 安行的 GitHub Pages 公開展示頁，內容包含高齡行者步行安全痛點、衛教宣傳、App 示範畫面、APK 下載入口，以及本機資料分析的隱私說明。

## 開發

```bash
npm run dev
npm run build:pages
```

主要頁面在 `app/page.tsx`，全站樣式在 `app/globals.css`，社群分享圖放在 `public/og.jpg`。

GitHub Pages 由 `.github/workflows/deploy-pages.yml` 自動發布。
