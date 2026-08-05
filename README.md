# AI Walk Buddy（AI 陪走夥伴）

AI Walk Buddy 是一個協助高齡行人安全穿越路口的 MVP 專案。核心概念是用極簡介面、震動與語音提示，將「剩餘綠燈秒數」轉換成「現在是否適合通過」。

## 專案結構

- `App.js`：Expo / React Native MVP App，包含步速測量、權限請求、Edge AI 模擬判斷與震動提醒。
- `website/`：公開介紹網站，說明高齡行人痛點、App 示意圖與 Edge AI 隱私設計。
- `app.json`：Expo 權限與 App 基本設定。

## 公開介紹網站

目前已部署：

https://ai-walk-buddy-safestride.p-jinzhan.chatgpt.site

本機開發：

```bash
npm run site:dev
npm run site:build
```

## App 開發

```bash
npm install
npm start
```

## GitHub 版本控制規劃

目標 GitHub 空間：

```text
AngleZero-collab
```

建議 repository：

```text
AngleZero-collab/ai-walk-buddy
```

版本流程：

1. `main`：穩定可展示版本。
2. `codex/app-mvp-hardening`：完善 App 功能、權限處理與測試。
3. `codex/site-content-updates`：介紹網站文案與視覺更新。

## 隱私原則

App 的相機、定位與加速度計資料皆以本機處理為原則；Demo 中不會上傳使用者影像、位置或動作資料。
