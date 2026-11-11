# 用網頁部署日子裡

程式使用 Firebase 專案 `calendar-app-68060`。不需要在 Windows 安裝 Node.js 或終端機工具。

## 1. 建立部署專用服務帳戶

1. 開啟 https://console.cloud.google.com/iam-admin/serviceaccounts?project=calendar-app-68060 ，確認頂端專案正確。
2. 點「建立服務帳戶」，名稱填 `github-calendar-deploy`。
3. 在授予專案存取權時加入三個角色：Firebase Hosting Admin（`roles/firebasehosting.admin`）、Firebase Rules Admin（`roles/firebaserules.admin`）、Firebase Viewer（`roles/firebase.viewer`）。不要給 Owner 或 Editor。
4. 完成後點進該服務帳戶 →「金鑰」→「新增金鑰」→「建立新的金鑰」→ JSON。瀏覽器會下載檔案。

該 JSON 是部署私密金鑰。只貼到下一步的 GitHub Secret，不要傳到對話、上傳到程式碼或放在公開檔案。若組織禁止建立金鑰，請保留政策並改用 Workload Identity Federation。

## 2. 存入 GitHub Secret

1. 開啟 https://github.com/Kai0430xx/calendar_app/settings/secrets/actions 。
2. 點「New repository secret」。
3. Name 填 `FIREBASE_SERVICE_ACCOUNT`。
4. 用 Windows 記事本開啟剛下載的 JSON，將完整內容貼入 Secret，點「Add secret」。

## 3. 點選發布

1. 開啟 https://github.com/Kai0430xx/calendar_app/actions 。
2. 左側選 `Deploy calendar to Firebase`。
3. 點「Run workflow」，選 `main`，再點綠色「Run workflow」。
4. 等待綠色勾勾。展開 `Publish Firestore rules and website`，使用 Firebase 回傳的 Hosting URL。之後每次推送 main 會自動部署。

此流程會發布目前儲存庫的 Firestore 規則，取代專案已發布規則。若專案另有其他 App，應先合併其規則再執行。此程式的規則只開放共用帳號自己的日曆資料。

## 4. 共用帳號與 iPhone

Firebase Console → Authentication → Users → Add user，建立 `kai0430xx@gmail.com` 的 Email/Password 使用者，設定兩人共用密碼。這是 App 的專用密碼，不是 Google 帳號密碼。若該使用者已存在就沿用，不要重建。

在兩支 iPhone 的 Safari 開啟部署網址，輸入同一密碼。新增、修改、刪除行程並確認另一支手機即時更新。Safari → 分享 → 加入主畫面，就有專屬圖示。

## 費用與公開設定

使用 Firebase Spark 免費方案與免費配額，不需要 Cloud Functions。GitHub Actions 亦受帳號免費額度限制。保持 Spark 可避免自動升級付費。

`.env.production` 是 Firebase 公開網頁設定，會隨網頁提供給瀏覽器；不是部署金鑰。共用密碼不在原始碼，資料存取由 Authentication 與 Firestore Rules 保護。更換登入 Email 時，必須同時修改公開設定及 `firestore.rules`。
