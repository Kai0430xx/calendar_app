import { test, expect } from "@playwright/test";
test("two independent mobile sessions sync create, edit, and delete through Firestore", async ({
  browser,
}) => {
  const a = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const b = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const one = await a.newPage();
  const two = await b.newPage();
  try {
    for (const page of [one, two]) {
      await page.goto("http://127.0.0.1:5175");
      await page.getByLabel("共同密碼").fill("Emulator-only-12345");
      await page.getByRole("button", { name: "打開日曆" }).click();
      await expect(
        page.getByRole("heading", { name: "回到我們的小日子" }),
      ).toHaveCount(0);
    }
    await one.getByRole("button", { name: "新增行程", exact: true }).click();
    await expect(one.getByLabel("分類").locator("option")).toHaveCount(4);
    await one.getByLabel("行程標題").fill("同步測試晚餐");
    await one.getByRole("button", { name: "儲存行程" }).click();
    await expect(two.locator(".grid-event")).toHaveText("09:00 同步測試晚餐");
    await two.locator(".grid-event").click();
    await two.getByLabel("行程標題").fill("兩人一起晚餐");
    await two.getByRole("button", { name: "儲存行程" }).click();
    await expect(one.locator(".grid-event")).toHaveText("09:00 兩人一起晚餐");
    await one.locator(".grid-event").click();
    one.once("dialog", (d) => d.accept());
    await one.getByRole("button", { name: "刪除", exact: true }).click();
    await expect(two.locator(".grid-event")).toHaveCount(0);
  } finally {
    await a.close();
    await b.close();
  }
});
