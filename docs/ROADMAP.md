# 專案 Roadmap

## 第一階段：建立專案與版本控制

- 建立單一 Git 專案，包含 Expo App 與公開介紹網站。
- 設定 `main` 作為穩定版本分支。
- 將 GitHub 遠端指向 `AngleZero-collab/SafeStride`。

## 第二階段：公開介紹網站

- 以 GitHub Pages 架設公開網站。
- 說明高齡行者痛點與步行安全衛教。
- 呈現 App 的步行分析示意與 APK 下載入口。

## 第三階段：可安裝 APK

- 透過 GitHub Actions 產生 Android 測試 APK。
- 手動 workflow 可下載 APK artifact。
- 推送 `v*` tag 時建立 GitHub Release 並附上 APK。

## 第四階段：手機端步行資料分析

- 移除攝像頭與定位流程。
- 使用手機計步器、活動辨識與加速度資料進行本機分析。
- 以步數、步頻、即時步速與晃動指數判斷步態是否穩定。
- 以全螢幕紅綠提示、語音與震動提醒高齡使用者。

## 第五階段：模型整合預留

- 保留 JSI / Native Modules 介面，後續可串接 C/C++ 輕量化步態分析模型。
- 確保手機端資料只在本機推論，不保存、不上傳隱私資料。
