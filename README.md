# 日子裡 · 我們的共用日曆

為兩人設計的圓潤卡通風手機日曆。React + TypeScript + Vite，Firebase Authentication（共用 Email/Password 帳號）、Firestore 即時監聽，Firebase Hosting 部署。無需 Cloud Functions 或付費方案。

## 已實作

- 月曆為首頁，可切換週曆、單日、回到今天。
- 行程標題、日期、開始時間、選填結束時間、全天、單一分類、備註；兩人均可新增、修改、刪除。
- 共用分類及自訂色彩、分類篩選；有行程的分類不能直接刪除。
- 同一 Firebase 帳號的兩台裝置使用相同資料，Firestore `onSnapshot` 即時同步；不同事件獨立儲存，避免用整份日曆覆蓋彼此的新增內容。同一行程同時修改採最後成功寫入者為準。
- 畫面只輸入共同密碼；帳號 Email 放在公開網頁設定，密碼交給 Firebase Authentication 驗證，未寫入程式、環境變數或 Firestore。
- iPhone「加入主畫面」所需 manifest、192/512 PNG 圖示、Apple 圖示、獨立視窗模式。
- 2026–2027 台灣辦公日曆假日。其他年份會顯示尚未收錄提示。

## 開發

使用 Node.js 22 或 24，以及 npm。沿用現有 checkout；每個雲端任務已隔離，除非使用者要求，不建立 Git worktree。

```sh
cd /workspace/calendar_app
npm ci --cache /tmp/calendar-npm-cache
cp .env.example .env.local # 已有 .env.local 時不要覆蓋
npm run dev -- --port 5173
```

`.env.example` 包含使用者提供的 Firebase 公開網頁設定。這些值及 Email 會編入網頁，並非伺服器秘密。資料保護必須依賴 Authentication 與 Firestore 規則；不得放入服務帳戶私鑰。`.env.local` 不進 Git。

未提供 Firebase 設定時會進入明確標示的「此裝置體驗模式」，資料存於 localStorage，不會跨手機同步。正式共用模式使用 Firestore，不會自動將體驗資料上傳。

## 正式使用前：Firebase Console 設定

專案：`calendar-app-68060`。

1. Authentication → Sign-in method → 啟用「電子郵件／密碼」。
2. Authentication → Users → 建立 `kai0430xx@gmail.com` 使用者，設定兩人共用的強密碼（至少 8 碼建議 12 碼以上）。不要將密碼提交至 Git 或貼進對話。這是 Firebase App 使用者，**不要使用你的 Google 帳號密碼**。
3. Firestore Database → Create database，建立預設資料庫，選擇適當地區，以 Production mode 開始。
4. Firestore → Rules → 貼入本專案 `firestore.rules` 全文並 Publish，取代預設規則。規則只允許已登入且 Email 為上述帳號的使用者讀寫其自身 UID 路徑。不要採用 `allow read, write: if true`。若更換共用 Email，必須同步更新環境設定及規則。
5. 第一次登入會建立四個預設分類；兩人登入同一帳號即可使用同一份日曆。

原始碼已串接指定專案。使用者於 2026-11-11 確認 Authentication 電子郵件／密碼、Firestore 與 Hosting 已啟用；此環境尚未登入 Firebase CLI，未獨立驗證正式帳號及已發布規則，也未寫入正式資料庫。

## 免費部署：Firebase Hosting

使用 Firebase **Spark** 方案，在免費配額內使用，不需升級 Blaze 或建立 Cloud Functions。服務仍有容量、流量、讀寫及可用性限制，請在 Console 監看使用量。

在你已登入 Firebase CLI 的電腦或已授權的開發環境中：

```sh
npm ci
# 確認 .env.local 已填妥；Vite 設定是在建置時編入
npm run build
npx firebase login
npx firebase deploy --only firestore:rules,hosting --project calendar-app-68060
```

`firebase.json` 已設定輸出目錄 `dist` 與 SPA fallback。部署指令會發布規則及網站，請確認專案正確再執行。使用 Firebase CLI 回傳的 HTTPS 網址；本次開發尚未部署，不提供未驗證的上線網址。

第一次開啟：在 Safari 輸入共用密碼，另一支手機開同一網址並輸入相同密碼。建立一個行程並確認另一支手機立即顯示，再測試修改及刪除。這一步需要正式帳號，不能以本機體驗模式取代。

## 安裝到 iPhone

在 Safari 開啟已部署的 HTTPS 網站 → 分享 → 加入主畫面 → 新增。可從「設定與安裝」查看操作。安裝後有獨立 App 圖示與視窗，並非 App Store 原生 App。不需要通知授權；行程與同步需有網路。本版未提供完整離線模式。

## 驗證

```sh
npm run build
npm test
```

`npm test` 管理兩個本機 Vite 服務，測試手機行程 CRUD、全天、選填結束時間、重新整理後保留、分類編輯、檢視切換、安裝資源、登入畫面，以及 320/375/1440px 橫向溢出。預設使用此雲端環境的 `/usr/bin/chromium`；其他電腦可設定 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，或先 `npx playwright install chromium` 使用 Playwright 瀏覽器。

### Firebase 模擬器整合與權限測試

需 Java 21+。僅使用 `demo-cream-calendar` 專案與本機埠，不連正式資料庫。下載官方 emulator 需允許 `storage.googleapis.com`。若 Node CLI 需使用環境 HTTP proxy，可在支援的 Node 24 中設定 `NODE_USE_ENV_PROXY=1`，保留 TLS 憑證驗證。

```sh
npm run test:firebase
```

測試會啟動 Auth/Firestore 模擬器，建立測試用共用帳號，驗證兩個獨立瀏覽器工作階段的新增、修改、刪除即時同步，並驗證未登入、其他帳號、其他 UID 與無效資料均遭規則拒絕。測試密碼只屬於模擬器，不可用於正式帳號。

目前雲端網路拒絕下載官方 Firestore emulator，因此這組測試尚未執行；正式 Firebase 同步與規則不可宣稱已驗證。需在環境設定允許上述下載網域後重跑。正式網路連線另需允許 `identitytoolkit.googleapis.com`、`securetoken.googleapis.com`、`firestore.googleapis.com` 及專案 `calendar-app-68060.firebaseapp.com`。

## 假日資料

`src/holidays.json` 擷取 [TaiwanCalendar](https://github.com/ruyut/TaiwanCalendar) 2026、2027 年公開資料中的放假且具描述項目，來源為政府行政機關辦公日曆整理。週末以週日／週六顏色呈現，不額外顯示「休息日」。特定行業適用性仍以其規定為準。未自動連線更新，每年需補資料。

## 目前驗證範圍

- 本機 production build 與瀏覽器介面測試：已執行（最終結果以交付訊息為準）。
- Firebase Auth/Firestore 模擬器：因官方下載網域遭封鎖，尚未執行。
- 正式 Firebase 登入、跨裝置同步、發布規則、Hosting 部署、實機 iPhone 安裝：尚未執行；需要使用者帳號或 Console 設定。
- 雲端 reusable configuration 草稿工具回傳錯誤，無法確認 `install_script` / `start_skill` 保存；本文件保留完整步驟。

## 本次環境檢查（2026-11-11）

- `npm run build` 成功。
- Firebase CLI 沒有已登入帳號，無法發布 Hosting 或規則。
- 正式 Firebase API 連線被環境網路政策以 HTTP 403 拒絕，尚未驗證正式登入與跨裝置同步。
- Sites 預覽 relay 無法啟動，這次未完成手機瀏覽器視覺驗證。
- 共用登入目前指定 `kai0430xx@gmail.com`，須在 Firebase Authentication 建立該 Email 的密碼使用者；僅啟用登入供應商並不會自動建立帳號。

## 圓潤卡通介面更新

改用淡紫與粉紅配色、圓角卡片與按鈕，移除裝飾標語及英文。手機月份與工具列分行顯示，週曆以七天直式清單呈現，表單輸入字級 16px，常用操作按鈕至少 44px 高。App 圖示保留暫用圖，等待使用者圖片。此更新 production build 通過；預覽 relay 啟動失敗，未完成瀏覽器與 iPhone 實機驗證。

## 跨日行程

行程可設定開始／結束日期，結束日期包含當日。全天也可跨日；非全天行程的開始時間屬於第一天，選填結束時間屬於最後一天。月／週／日檢視皆顯示涵蓋日期。未設定 endDate 的舊資料視為單日。日期邏輯可執行 `node --experimental-strip-types --test tests/date-range.test.mjs`；Firestore 規則已補跨日測試，需模擬器環境才能執行。

## 手機首頁與密碼

手機首頁固定在可視高度內的日曆，點日期進入當日行程，再由左上角返回。停用瀏覽器 scroll restoration，pageshow 重設頁面位置，移除新增行程的自動聚焦，避免 iPhone 開啟鍵盤帶動畫面。每日清單可獨立捲動。此修改已通過建置，尚未完成 iPhone 實機檢查。

共用密碼由 Firebase Authentication 管理。Firebase Console → Authentication → Users → 找到共用帳號 → 選單中的重設密碼／傳送密碼重設郵件，再由信箱中的連結設定新密碼。兩人之後皆使用新密碼；請勿把密碼提交到 GitHub。

## 粉藍配色與滿版行程

介面與桌面圖示改為粉藍色，保留棕色狗狗；分類原有自訂色彩不變。分類篩選選取時有勾選標記與「顯示全部」。手機當日頁移除外圍卡片與留白，行程每筆使用完整可用寬度。圖示已調整狗頭與日曆比例。建置與日期測試通過；尚未完成手機實機視覺確認。
