# SafeStride 安行（AI 陪走夥伴）

SafeStride 安行是一個協助高齡行者判斷自身步行狀態的 MVP 專案。現階段不使用攝像頭、不使用定位，先以手機端步數、步頻與加速度資料做本機分析，並用高對比畫面、語音與震動提醒「步態穩定」或「請先停下休息」。

## 專案結構

- `App.js`：Expo / React Native MVP App，包含步速測量、手機感測器權限請求、本機步行分析與震動提醒。
- `website/`：GitHub Pages 介紹網站，包含高齡行者痛點、衛教宣傳、App 展示與 APK 下載入口。
- `.github/workflows/android-apk.yml`：產生 Android APK 的 GitHub Actions workflow。
- `.github/workflows/deploy-pages.yml`：部署 GitHub Pages 的 workflow。
- `docs/APK_BUILD.md`：APK 下載與建置說明。
- `docs/ROADMAP.md`：後續版本規劃。

## 公開網站

GitHub Pages 網址：

```text
https://anglezero-collab.github.io/SafeStride/
```

本機建置 GitHub Pages 靜態輸出：

```bash
npm run site:build:pages
```

## APK 下載

GitHub Release 下載頁：

```text
https://github.com/AngleZero-collab/SafeStride/releases/latest
```

若尚未建立 Release，可到 GitHub 的 `Actions` 執行 `產生 Android APK`，下載 `SafeStride-mvp-debug-apk` artifact。

## App 開發

```bash
npm install
npm start
```

## 目前 App 權限

- 動作感測器：讀取加速度資料，分析步態穩定度。
- 活動辨識 / 計步器：讀取手機端步數與步頻。
- 震動：提供高對比畫面以外的觸覺提醒。

## 隱私原則

App 的步數、步頻與加速度資料皆只在手機本機分析；Demo 中不會上傳使用者影像、位置或動作資料。未來若需要更精準的步態模型，可透過 JSI 或 Native Modules 串接 C/C++ 輕量化模型，仍維持本機端推論。
