# 悅步 JoyWalk（高齡行人過馬路防護與步態分析）

悅步 JoyWalk 是一個協助高齡行者判斷自身步行狀態與路口安全秒數的 MVP 專案。現階段不使用攝像頭，先以手機端步數、步頻、加速度、陀螺儀與 GPS 停等狀態做本機分析，並用高對比畫面、語音與震動提醒「可以通過」或「建議兩段式過馬路」。

## 專案結構

- `App.js`：Expo / React Native MVP App，包含即時過馬路防護、GPS 路口秒數估算、進階步態分析、虛擬寵物任務、獎勵商店與家屬設定。
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

APK 直接下載：

```text
https://github.com/AngleZero-collab/SafeStride/releases/latest/download/SafeStride-mvp-release.apk
```

若尚未建立 Release，可到 GitHub 的 `Actions` 執行 `產生 Android Release APK`，下載 `SafeStride-mvp-release-apk` artifact。為了延續既有下載連結，正式 Release 檔名仍為 `SafeStride-mvp-release.apk`，但 App 顯示名稱已改為「悅步 JoyWalk」，並已內含 JavaScript bundle，可直接安裝執行。

## App 開發

```bash
npm install
npm start
```

## 目前 App 權限

- 動作感測器：讀取加速度計與陀螺儀資料，分析步態穩定度。
- 前景定位：偵測是否停在路口，估算安全通過秒數。
- 活動辨識 / 計步器：讀取手機端步數與步頻。
- 震動：提供高對比畫面以外的觸覺提醒。

## 隱私原則

App 的步數、步頻、加速度、陀螺儀與 GPS 停等判斷皆只在手機本機分析；Demo 中不會上傳使用者影像、動作資料或定位座標。路寬以本機保守規則估算。未來若需要更精準的步態模型，可透過 JSI 或 Native Modules 串接 C/C++ 輕量化模型，仍維持本機端推論。
