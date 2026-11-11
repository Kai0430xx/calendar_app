import { test, expect } from "@playwright/test";
const url = "http://127.0.0.1:5174";
test("mobile event CRUD, optional end time, all-day and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "一起，把日子過成喜歡的樣子" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "新增行程", exact: true }).click();
  await page.getByLabel("行程標題").fill("一起吃晚餐");
  await page.getByLabel("開始時間").fill("18:30");
  await page.getByLabel("備註").fill("記得訂位");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".grid-event")).toContainText("一起吃晚餐");
  await page.reload();
  await expect(page.locator(".grid-event")).toContainText("一起吃晚餐");
  await page.locator(".grid-event").click();
  await page.getByLabel("全天行程").check();
  await expect(page.getByLabel("開始時間")).toHaveCount(0);
  await page.getByRole("button", { name: "儲存行程" }).click();
  await page.locator(".grid-event").click();
  await page.getByLabel("行程標題").fill("全天小旅行");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.locator(".grid-event")).toHaveText("全天小旅行");
  page.once("dialog", (d) => d.accept());
  await page.locator(".grid-event").click();
  await page.getByRole("button", { name: "刪除", exact: true }).click();
  await expect(page.locator(".grid-event")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("category editing, view switches, holidays, installation instructions", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page
    .getByRole("button", { name: "管理分類", exact: true })
    .last()
    .click();
  await page.getByRole("textbox", { name: "新分類名稱" }).fill("一起運動");
  await page.getByRole("button", { name: "新增分類", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "分類名稱", exact: true }),
  ).toHaveCount(5);
  const row = page.locator(".category-row").last();
  await row
    .getByRole("textbox", { name: "分類名稱", exact: true })
    .fill("一起散步");
  await row.getByRole("button", { name: "儲存分類" }).click();
  await page.getByRole("button", { name: "關閉", exact: true }).click();
  await page.locator(".sidebar .nav-item.active").click();
  await page.getByRole("button", { name: "週", exact: true }).click();
  await expect(page.locator(".agenda-date")).toHaveCount(7);
  await page.getByRole("button", { name: "日", exact: true }).click();
  await expect(page.locator(".agenda-date")).toHaveCount(1);
  await page.getByRole("button", { name: "月", exact: true }).click();
  await expect(page.locator(".day-cell")).toHaveCount(42);
  await page.locator(".avatar-button").click();
  await expect(page.getByText("安裝到 iPhone 桌面")).toBeVisible();
  await expect(
    page.getByText("2026–2027 年台灣辦公日曆假日", { exact: false }),
  ).toBeVisible();
});
test("desktop and narrow phone fit without horizontal overflow", async ({
  page,
}) => {
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `width ${width}`,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url);
  await page.screenshot({ path: "/tmp/calendar-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "/tmp/calendar-mobile.png", fullPage: true });
});
test("configured project shows password login and installs valid icons", async ({
  page,
  request,
}) => {
  await page.goto("http://127.0.0.1:5173");
  await expect(
    page.getByRole("heading", { name: "回到我們的小日子" }),
  ).toBeVisible();
  for (const path of [
    "/manifest.webmanifest",
    "/icon-192.png",
    "/icon-512.png",
  ]) {
    const r = await request.get("http://127.0.0.1:5173" + path);
    expect(r.status()).toBe(200);
  }
  await page.screenshot({ path: "/tmp/calendar-login.png" });
});

test("validates time range, navigates to saved date and protects a used category", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole("button", { name: "新增行程", exact: true }).click();
  await page.getByLabel("行程標題").fill("聖誕約會");
  await page.getByLabel("日期", { exact: true }).fill("2026-12-25");
  await page.getByLabel("開始時間").fill("18:00");
  await page.getByLabel("結束時間（選填）").fill("17:00");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "結束時間需晚於開始時間",
  );
  await page.getByLabel("結束時間（選填）").fill("19:00");
  await page.getByRole("button", { name: "儲存行程" }).click();
  await expect(page.locator(".grid-event")).toContainText("聖誕約會");
  await expect(page.locator(".holiday-pill")).toContainText("行憲紀念日");
  await page.getByRole("button", { name: "開啟選單" }).click();
  await page
    .getByRole("button", { name: "管理分類", exact: true })
    .last()
    .click();
  await page
    .locator(".category-row")
    .first()
    .getByRole("button", { name: "刪除分類" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "此分類仍有行程",
  );
});
