import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
test("calendar rules isolate the shared account and validate writes", async (t) => {
  const env = await initializeTestEnvironment({
    projectId: "demo-cream-calendar",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  try {
    const db = env
      .authenticatedContext("couple", { email: "kai0430xx@gmail.com" })
      .firestore();
    const category = "calendars/couple/categories/date";
    const path = "calendars/couple/events/event1";
    const value = {
      id: "event1",
      title: "一起吃飯",
      date: "2026-11-11",
      start: "18:00",
      end: "",
      allDay: false,
      category: "date",
      notes: "",
    };
    await t.test("member can create category and event", async () => {
      await assertSucceeds(
        setDoc(doc(db, category), {
          id: "date",
          name: "約會",
          color: "#d99484",
        }),
      );
      await assertSucceeds(setDoc(doc(db, path), value));
      await assertSucceeds(getDoc(doc(db, path)));
    });
    await t.test("anonymous requests are denied", async () => {
      const anon = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(anon, path)));
      await assertFails(setDoc(doc(anon, path), value));
    });
    await t.test(
      "other accounts cannot access shared calendar or create their own",
      async () => {
        const other = env
          .authenticatedContext("stranger", { email: "someone@example.com" })
          .firestore();
        await assertFails(getDoc(doc(other, path)));
        await assertFails(
          setDoc(doc(other, "calendars/stranger/categories/date"), {
            id: "date",
            name: "Other",
            color: "#112233",
          }),
        );
      },
    );
    await t.test("member cannot access another uid", async () => {
      await assertFails(getDoc(doc(db, "calendars/another/events/event1")));
    });
    await t.test(
      "invalid category, time, oversized or extra data are denied",
      async () => {
        for (const change of [
          { category: "missing" },
          { end: "17:00" },
          { title: "" },
          { title: "x".repeat(101) },
          { notes: "x".repeat(2001) },
          { start: "25:00" },
          { unexpected: true },
        ])
          await assertFails(setDoc(doc(db, path), { ...value, ...change }));
      },
    );
    await t.test("member may update and delete", async () => {
      await assertSucceeds(
        setDoc(doc(db, path), { ...value, title: "改成晚餐", allDay: true }),
      );
      await assertSucceeds(deleteDoc(doc(db, path)));
    });
  } finally {
    await env.cleanup();
  }
});
