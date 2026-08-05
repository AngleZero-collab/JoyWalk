# APK 下載與建置方式

SafeStride 目前以 GitHub Actions 產生 Android 測試 APK，方便直接安裝到手機試用。

## 手動產生 APK Artifact

1. 到 GitHub repository：`AngleZero-collab/SafeStride`
2. 打開 `Actions`
3. 選擇 `產生 Android APK`
4. 點選 `Run workflow`
5. 等待流程完成後，下載 `SafeStride-mvp-debug-apk`

下載後將 `SafeStride-mvp-debug.apk` 傳到 Android 手機，允許「安裝未知來源 App」即可安裝。

## 建立公開下載版本

當需要產生 GitHub Release 下載連結時，在本機建立版本 tag：

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions 會自動建置 APK，並把 `SafeStride-mvp-debug.apk` 附加到對應的 GitHub Release。

## 目前 App 權限

此版本不使用攝像頭、不使用定位。App 僅使用：

- 動作感測器：讀取加速度資料，分析步態穩定度。
- 活動辨識 / 計步器：讀取手機端步數與步頻。
- 震動：提供高對比畫面以外的觸覺提醒。

所有資料只在手機本機分析，不上傳雲端。
