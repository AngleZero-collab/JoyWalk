# APK 下載與建置方式

悅步 JoyWalk 目前以 GitHub Actions 產生 Android Release APK，方便直接安裝到手機試用。Release APK 會把 JavaScript bundle 一起打包進安裝檔，因此不需要連著電腦或 Metro。

APK 直接下載：

```text
https://github.com/AngleZero-collab/SafeStride/releases/latest/download/SafeStride-mvp-release.apk
```

若手機出現 `Unable to load script`，通常代表安裝到 Debug APK；請改裝正式 Release APK。

## 手動產生 APK Artifact

1. 到 GitHub repository：`AngleZero-collab/SafeStride`
2. 打開 `Actions`
3. 選擇 `產生 Android Release APK`
4. 點選 `Run workflow`
5. 等待流程完成後，下載 `SafeStride-mvp-release-apk`

下載後將 `SafeStride-mvp-release.apk` 傳到 Android 手機，允許「安裝未知來源 App」即可安裝。

## 建立公開下載版本

當需要產生 GitHub Release 下載連結時，在本機建立版本 tag：

```bash
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions 會自動建置 APK，並把 `SafeStride-mvp-release.apk` 附加到對應的 GitHub Release。

## 目前 App 權限

此版本不使用攝像頭。App 僅使用：

- 動作感測器：讀取加速度計與陀螺儀資料，分析步態穩定度。
- 前景定位：偵測是否停在路口，估算安全通過秒數。
- 活動辨識 / 計步器：讀取手機端步數與步頻。
- 震動：提供高對比畫面以外的觸覺提醒。

動作感測器資料只在手機本機分析，不上傳雲端。OSM 路寬查詢預設關閉；家屬開啟後才會用目前定位查詢道路寬度。
