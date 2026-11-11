import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Heart,
  CalendarDays,
  SlidersHorizontal,
  X,
  Check,
  ArrowUpRight,
  LockKeyhole,
  RefreshCw,
  Trash2,
  Menu,
  Download,
  LogOut,
  Cloud,
  Flower2,
} from "lucide-react";
import {
  configured,
  initial,
  remote,
  loginCalendar,
  observeAuth,
  logoutCalendar,
  subscribeCalendar,
  seedCategories,
  type CalendarData,
  type Entry,
  type Category,
} from "./backend";
import "./style.css";
import holidayData from "./holidays.json";
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => new Date(s + "T12:00:00");
const today = key(new Date());
const holidays: Record<string, string> = holidayData;
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
function App() {
  const [data, setData] = useState<CalendarData>(() => {
    try {
      return configured
        ? initial
        : JSON.parse(localStorage.getItem("cream-demo") || "null") || initial;
    } catch {
      return initial;
    }
  });
  const [unlocked, setUnlocked] = useState(!configured);
  const [login, setLogin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const [selected, setSelected] = useState(today);
  const [view, setView] = useState("月");
  const [modal, setModal] = useState<
    "event" | "categories" | "settings" | null
  >(null);
  const [edit, setEdit] = useState<Entry | null>(null);
  const [filter, setFilter] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#d99484");
  useEffect(() => {
    if (!modal) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setModal(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [modal, busy]);
  const date = parse(selected);
  const shown = data.events.filter(
    (e) => !filter.length || filter.includes(e.category),
  );
  const dayEvents = shown
    .filter((e) => e.date === selected)
    .sort((a, b) => a.start.localeCompare(b.start));
  useEffect(() => {
    if (!configured) return;
    return observeAuth((ready) => {
      setUnlocked(ready);
      if (ready) {
        void seedCategories().catch((e) => setError(e.message));
      }
    });
  }, []);
  useEffect(() => {
    if (!configured || !unlocked) return;
    return subscribeCalendar(
      (next) => {
        setData(next);
        setStatus("已即時同步");
        setError("");
      },
      (e) => {
        setError(e.message);
        setStatus("同步失敗");
      },
    );
  }, [unlocked]);
  useEffect(() => {
    if (!configured) localStorage.setItem("cream-demo", JSON.stringify(data));
  }, [data]);
  async function mutate(
    action: string,
    payload: Record<string, unknown>,
    local: CalendarData,
  ) {
    if (configured && !navigator.onLine) {
      setError("目前沒有網路，請恢復連線後再儲存。");
      return false;
    }
    setBusy(true);
    setError("");
    try {
      if (configured) {
        await remote(action, payload);
        setStatus("已同步");
      } else setData(local);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function move(n: number) {
    const d = parse(selected);
    if (view === "月") {
      d.setDate(1);
      d.setMonth(d.getMonth() + n);
    } else d.setDate(d.getDate() + n * (view === "週" ? 7 : 1));
    setSelected(key(d));
  }
  function openEvent(e?: Entry, day = selected) {
    setEdit(
      e || {
        id: crypto.randomUUID(),
        title: "",
        date: day,
        start: "09:00",
        end: "",
        allDay: false,
        category: data.categories[0]?.id || "",
        notes: "",
      },
    );
    setModal("event");
  }
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekStart = parse(selected);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const cat = (id: string) => data.categories.find((c) => c.id === id);
  return (
    <div className="app">
      <aside
        inert={!!modal || (configured && !unlocked)}
        className={"sidebar " + (mobileMenu ? "open" : "")}
      >
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <div className="brand-icon">
            <CalendarDays size={23} />
            <Heart size={10} fill="currentColor" />
          </div>
          <span>
            日子裡<small>OUR LITTLE DAYS</small>
          </span>
        </a>
        <div className="space-card">
          <span className="avatars">
            ♡<span>♡</span>
          </span>
          <div>
            <b>我們的小日子</b>
            <small>兩個人，一起好好生活</small>
          </div>
          <span className="online-dot" />
        </div>
        <p className="nav-label">我們的手帳</p>
        <button
          className="nav-item active"
          onClick={() => setMobileMenu(false)}
        >
          <CalendarDays size={19} />
          共用日曆<span>♡</span>
        </button>
        <div className="category-heading">
          <p className="nav-label">行程分類</p>
          <button aria-label="管理分類" onClick={() => setModal("categories")}>
            <Plus size={17} />
          </button>
        </div>
        <div className="category-list">
          {data.categories.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                setFilter(
                  filter.includes(c.id)
                    ? filter.filter((x) => x !== c.id)
                    : [...filter, c.id],
                )
              }
              className={filter.includes(c.id) ? "selected-filter" : ""}
            >
              <span className="color-dot" style={{ background: c.color }} />
              {c.name}
              <span className="category-count">
                {data.events.filter((e) => e.category === c.id).length}
              </span>
            </button>
          ))}
        </div>
        <button className="manage" onClick={() => setModal("categories")}>
          <SlidersHorizontal size={14} />
          管理分類
        </button>
        <div className="sidebar-bottom">
          <div className="little-note">
            <Flower2 size={29} />
            <p>
              平凡的日子，
              <br />
              因為有你而閃閃發光。
            </p>
            <span>make room for us</span>
          </div>
          <button className="nav-item" onClick={() => setModal("settings")}>
            <SlidersHorizontal size={17} />
            設定與安裝
            <ArrowUpRight size={15} />
          </button>
          <div className="sync">
            <span className="online-dot" />
            {configured
              ? !online
                ? "離線中"
                : status || "連線中"
              : "此裝置體驗模式"}
            <Cloud size={14} />
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <main inert={!!modal || (configured && !unlocked)}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="開啟選單"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={20} />
            </button>
            我們的手帳<span>/</span>
            <b>共用日曆</b>
          </div>
          <span className="header-note">
            把喜歡的日子，都放在一起 <Heart size={14} />
          </span>
          <button
            className="avatar-button"
            onClick={() => setModal("settings")}
          >
            ♡
          </button>
        </header>
        <div className="content">
          <section className="page-title">
            <div>
              <div className="eyebrow">A LITTLE PLAN, A LOT OF LOVE</div>
              <h1>
                一起，把日子過成喜歡的樣子<span>✳</span>
              </h1>
              <p>記下每一次約會，也收藏每一個平凡的日常。</p>
            </div>
            <button className="primary add-desktop" onClick={() => openEvent()}>
              <Plus size={18} />
              新增行程
            </button>
          </section>
          {configured && !online && (
            <div className="error" role="status">
              目前沒有網路，恢復連線後才能儲存與同步。
            </div>
          )}
          {!configured && (
            <div className="demo-banner">
              <Cloud size={15} />
              <span>
                目前為此裝置體驗模式；連接共用後端後，即可讓兩支手機同步。
              </span>
              <button onClick={() => setModal("settings")}>
                查看設定
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          <div className="calendar-layout">
            <section className="calendar-card">
              <div className="calendar-toolbar">
                <div className="month-heading">
                  <h2>
                    {date.getFullYear()}
                    <span>年</span> {date.getMonth() + 1}
                    <span>月</span>
                  </h2>
                  <span className="english-month">
                    {date.toLocaleString("en", { month: "long" }).toUpperCase()}
                  </span>
                </div>
                <div className="calendar-controls">
                  <button className="today" onClick={() => setSelected(today)}>
                    今天
                  </button>
                  <button aria-label="上一期" onClick={() => move(-1)}>
                    <ChevronLeft size={19} />
                  </button>
                  <button aria-label="下一期" onClick={() => move(1)}>
                    <ChevronRight size={19} />
                  </button>
                  <div className="view-tabs">
                    {["月", "週", "日"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={view === v ? "active" : ""}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {view === "月" ? (
                <>
                  <div className="weekdays">
                    {weekdays.map((w, i) => (
                      <span
                        key={w}
                        className={i === 0 || i === 6 ? "weekend" : ""}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                  <div className="month-grid">
                    {days.map((d) => {
                      const k = key(d);
                      const events = shown.filter((e) => e.date === k);
                      return (
                        <div
                          key={k}
                          className={
                            "day-cell " +
                            (d.getMonth() !== date.getMonth() ? "muted " : "") +
                            (k === selected ? "chosen " : "") +
                            (k === today ? "is-today" : "")
                          }
                          onClick={() => setSelected(k)}
                          onDoubleClick={() => openEvent(undefined, k)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setSelected(k);
                          }}
                          aria-label={k}
                        >
                          <div className="day-number">
                            <span
                              className={
                                d.getDay() === 0 || d.getDay() === 6
                                  ? "weekend"
                                  : ""
                              }
                            >
                              {d.getDate()}
                            </span>
                            {k === today && <small>今天</small>}
                          </div>
                          {holidays[k] && (
                            <div className="holiday">{holidays[k]}</div>
                          )}
                          {events.slice(0, 3).map((e) => (
                            <button
                              key={e.id}
                              className="grid-event"
                              style={{
                                background: cat(e.category)?.color + "23",
                                color: cat(e.category)?.color,
                              }}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                openEvent(e);
                              }}
                            >
                              <i
                                style={{ background: cat(e.category)?.color }}
                              />
                              <span>
                                {!e.allDay && e.start + " "}
                                {e.title}
                              </span>
                            </button>
                          ))}
                          {events.length > 3 && (
                            <span className="more-events">
                              +{events.length - 3} 個行程
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  className={"agenda-view " + (view === "週" ? "weekly" : "")}
                >
                  {(view === "週" ? weekDays : [date]).map((d) => {
                    const k = key(d);
                    const entries = shown.filter((e) => e.date === k);
                    return (
                      <section
                        className={k === today ? "agenda-today" : ""}
                        key={k}
                      >
                        <button
                          className="agenda-date"
                          onClick={() => setSelected(k)}
                        >
                          <span>週{weekdays[d.getDay()]}</span>
                          <b>{d.getDate()}</b>
                        </button>
                        {holidays[k] && (
                          <div className="holiday">{holidays[k]}</div>
                        )}
                        {entries.map((e) => (
                          <button
                            className="agenda-event"
                            style={{ borderLeftColor: cat(e.category)?.color }}
                            key={e.id}
                            onClick={() => openEvent(e)}
                          >
                            <small>
                              {e.allDay
                                ? "全天"
                                : e.start + (e.end ? " – " + e.end : "")}
                            </small>
                            <strong>{e.title}</strong>
                            <span>{cat(e.category)?.name}</span>
                          </button>
                        ))}
                        <button
                          className="agenda-add"
                          aria-label={`新增 ${k} 行程`}
                          onClick={() => openEvent(undefined, k)}
                        >
                          <Plus size={16} />
                        </button>
                      </section>
                    );
                  })}
                </div>
              )}
              {![2026, 2027].includes(date.getFullYear()) && (
                <p className="holiday-warning">此年份尚未收錄台灣國定假日。</p>
              )}
              <footer className="calendar-footer">
                <span>
                  <span className="holiday-dot" />
                  台灣國定假日 · 2026–2027
                </span>
                <span>
                  小小計畫，大大期待 <Heart size={12} />
                </span>
              </footer>
            </section>
            <aside className="day-panel">
              <div className="day-panel-heading">
                <span>TODAY'S LITTLE THINGS</span>
                <Flower2 size={20} />
              </div>
              <div className="selected-date">
                <b>{date.getDate()}</b>
                <div>
                  <strong>
                    {date.getMonth() + 1} 月 · 星期{weekdays[date.getDay()]}
                  </strong>
                  <span>
                    {selected === today
                      ? "就是今天，好好生活"
                      : "每一天都值得期待"}
                  </span>
                </div>
              </div>
              {holidays[selected] && (
                <div className="holiday-pill">✧ {holidays[selected]}</div>
              )}
              <div className="daily-heading">
                <h3>這一天的安排</h3>
                <span>{dayEvents.length} 個行程</span>
              </div>
              <div className="day-events">
                {dayEvents.length ? (
                  dayEvents.map((e) => (
                    <button
                      className="event-item"
                      key={e.id}
                      onClick={() => openEvent(e)}
                    >
                      <div className="event-time">
                        {e.allDay ? "全天" : e.start}
                        <span>{e.end}</span>
                      </div>
                      <div
                        className="event-detail"
                        style={{ borderColor: cat(e.category)?.color }}
                      >
                        <span style={{ color: cat(e.category)?.color }}>
                          {cat(e.category)?.name}
                        </span>
                        <b>{e.title}</b>
                        {e.notes && <p>{e.notes}</p>}
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  ))
                ) : (
                  <div className="empty-day">
                    <div className="cup">
                      <img
                        src="/couple-bears.svg"
                        alt="兩隻一起收藏小日子的奶油小熊"
                      />
                      <span>♡</span>
                    </div>
                    <b>留點空白，也很好</b>
                    <p>
                      還沒有安排，
                      <br />
                      一起為今天加點小期待吧。
                    </p>
                  </div>
                )}
              </div>
              <button className="add-day" onClick={() => openEvent()}>
                <Plus size={16} />
                為這一天新增行程
              </button>
              <div className="quote">
                <span>“</span>
                <p>
                  最好的日子，
                  <br />
                  是有你參與的每一天。
                </p>
                <small>OUR DAYS, OUR WAY</small>
                <Heart size={25} />
              </div>
            </aside>
          </div>
          <div className="bottom-note">
            <Heart size={13} /> 日子慢慢過，我們一起記。
          </div>
        </div>
        <button
          className="floating-add"
          onClick={() => openEvent()}
          aria-label="新增行程"
        >
          <Plus />
        </button>
      </main>
      {configured && !unlocked && (
        <div className="modal-overlay">
          <form
            className="modal login-modal"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await loginCalendar(login);
                setLogin("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="login-icon">
              <LockKeyhole />
            </div>
            <h2>回到我們的小日子</h2>
            <p>輸入兩人共用的密碼，打開我們的日曆。</p>
            <label>
              共同密碼
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </label>
            {error && (
              <p className="error">密碼不正確或連線失敗，請再試一次。</p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "連線中…" : "打開日曆"}
              <ArrowUpRight size={16} />
            </button>
          </form>
        </div>
      )}
      {modal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!busy) setModal(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "event"
                ? "編輯行程"
                : modal === "categories"
                  ? "管理分類"
                  : "設定與安裝"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>
                {modal === "event"
                  ? data.events.some((e) => e.id === edit?.id)
                    ? "編輯小日子"
                    : "新增小期待"
                  : modal === "categories"
                    ? "我們的行程分類"
                    : "設定與安裝"}
              </h2>
              <button aria-label="關閉" onClick={() => setModal(null)}>
                <X size={20} />
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {modal === "event" && edit && (
              <form
                onSubmit={async (ev) => {
                  ev.preventDefault();
                  if (!edit.allDay && edit.end && edit.end <= edit.start) {
                    setError("結束時間需晚於開始時間");
                    return;
                  }
                  if (
                    await mutate(
                      "save_event",
                      { event: edit },
                      {
                        ...data,
                        events: [
                          ...data.events.filter((e) => e.id !== edit.id),
                          edit,
                        ],
                      },
                    )
                  ) {
                    setSelected(edit.date);
                    setModal(null);
                  }
                }}
              >
                <label>
                  行程標題
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    placeholder="想一起做些什麼呢？"
                    value={edit.title}
                    onChange={(e) =>
                      setEdit({ ...edit, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  日期
                  <input
                    required
                    type="date"
                    value={edit.date}
                    onChange={(e) => setEdit({ ...edit, date: e.target.value })}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={edit.allDay}
                    onChange={(e) =>
                      setEdit({ ...edit, allDay: e.target.checked })
                    }
                  />
                  全天行程
                </label>
                {!edit.allDay && (
                  <div className="form-row">
                    <label>
                      開始時間
                      <input
                        required
                        type="time"
                        value={edit.start}
                        onChange={(e) =>
                          setEdit({ ...edit, start: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      結束時間（選填）
                      <input
                        type="time"
                        value={edit.end}
                        onChange={(e) =>
                          setEdit({ ...edit, end: e.target.value })
                        }
                      />
                    </label>
                  </div>
                )}
                <label>
                  分類
                  <select
                    required
                    value={edit.category}
                    onChange={(e) =>
                      setEdit({ ...edit, category: e.target.value })
                    }
                  >
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  備註
                  <textarea
                    maxLength={2000}
                    rows={3}
                    placeholder="寫下地點、想法，或給彼此的小提醒…"
                    value={edit.notes}
                    onChange={(e) =>
                      setEdit({ ...edit, notes: e.target.value })
                    }
                  />
                </label>
                <div className="modal-actions">
                  {data.events.some((e) => e.id === edit.id) && (
                    <button
                      type="button"
                      className="danger"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          window.confirm("確定刪除這個行程嗎？") &&
                          (await mutate(
                            "delete_event",
                            { id: edit.id },
                            {
                              ...data,
                              events: data.events.filter(
                                (e) => e.id !== edit.id,
                              ),
                            },
                          ))
                        )
                          setModal(null);
                      }}
                    >
                      <Trash2 size={16} />
                      刪除
                    </button>
                  )}
                  <button className="primary" disabled={busy}>
                    <Check size={16} />
                    {busy ? "儲存中…" : "儲存行程"}
                  </button>
                </div>
              </form>
            )}
            {modal === "categories" && (
              <>
                <p className="modal-description">
                  用喜歡的顏色，整理我們的每一種日常。
                </p>
                <div className="category-editor">
                  {data.categories.map((c) => (
                    <CategoryRow
                      key={c.id}
                      category={c}
                      busy={busy}
                      onSave={(c) =>
                        void mutate(
                          "save_category",
                          { category: c },
                          {
                            ...data,
                            categories: data.categories.map((x) =>
                              x.id === c.id ? c : x,
                            ),
                          },
                        )
                      }
                      onDelete={() => {
                        if (data.events.some((e) => e.category === c.id)) {
                          setError("此分類仍有行程，請先將行程移至其他分類。");
                          return;
                        }
                        if (data.categories.length === 1) {
                          setError("請至少保留一個分類。");
                          return;
                        }
                        void mutate(
                          "delete_category",
                          { id: c.id },
                          {
                            ...data,
                            categories: data.categories.filter(
                              (x) => x.id !== c.id,
                            ),
                          },
                        );
                      }}
                    />
                  ))}
                </div>
                <form
                  className="new-category"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const c = {
                      id: crypto.randomUUID(),
                      name: newName.trim(),
                      color: newColor,
                    };
                    if (!c.name) return;
                    if (
                      await mutate(
                        "save_category",
                        { category: c },
                        { ...data, categories: [...data.categories, c] },
                      )
                    )
                      setNewName("");
                  }}
                >
                  <input
                    aria-label="新分類顏色"
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                  <input
                    aria-label="新分類名稱"
                    placeholder="新的分類名稱"
                    required
                    maxLength={30}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button
                    disabled={busy}
                    className="primary"
                    aria-label="新增分類"
                  >
                    <Plus size={18} />
                  </button>
                </form>
              </>
            )}
            {modal === "settings" && (
              <div className="settings">
                <div className="setting-box">
                  <Cloud size={22} />
                  <div>
                    <b>{configured ? "兩人共用同步" : "此裝置體驗模式"}</b>
                    <p>
                      {configured
                        ? "變更會透過 Firebase Firestore 即時同步到兩人的手機。"
                        : "目前資料只保存在這個瀏覽器。需設定 Firebase 才能跨手機共用，詳細步驟請見專案 README。"}
                    </p>
                  </div>
                </div>
                <h3>
                  <Download size={18} />
                  安裝到 iPhone 桌面
                </h3>
                <ol>
                  <li>使用 Safari 開啟已部署的網站。</li>
                  <li>點選「分享」按鈕。</li>
                  <li>選擇「加入主畫面」，再點選「新增」。</li>
                </ol>
                <p>
                  加入後可使用專屬圖示，以獨立 App
                  視窗開啟。編輯與同步需要網路連線。
                </p>
                <h3>台灣國定假日</h3>
                <p>
                  目前內建 2026–2027
                  年台灣辦公日曆假日。資料來自政府辦公日曆開源整理；其他年份尚未收錄，部分職業適用假日仍依雇主規定。
                </p>
                {configured && (
                  <button
                    className="secondary"
                    onClick={() => {
                      void logoutCalendar();
                      setUnlocked(false);
                      setData(initial);
                      setModal(null);
                    }}
                  >
                    <LogOut size={16} />
                    鎖定日曆
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function CategoryRow({
  category,
  busy,
  onSave,
  onDelete,
}: {
  category: Category;
  busy: boolean;
  onSave: (c: Category) => void;
  onDelete: () => void;
}) {
  const [c, setC] = useState(category);
  useEffect(() => setC(category), [category.name, category.color]);
  return (
    <form
      className="category-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (c.name.trim()) onSave({ ...c, name: c.name.trim() });
      }}
    >
      <input
        aria-label="分類顏色"
        type="color"
        value={c.color}
        onChange={(e) => setC({ ...c, color: e.target.value })}
      />
      <input
        aria-label="分類名稱"
        required
        maxLength={30}
        value={c.name}
        onChange={(e) => setC({ ...c, name: e.target.value })}
      />
      <button disabled={busy} aria-label="儲存分類">
        <Check size={17} />
      </button>
      <button
        type="button"
        disabled={busy}
        aria-label="刪除分類"
        onClick={onDelete}
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
