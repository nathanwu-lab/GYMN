import { useState } from "react";
import ExercisesPage from "./pages/ExercisesPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import SchedulePage from "./pages/SchedulePage";
import TodayPage from "./pages/TodayPage";

type Tab = "today" | "schedule" | "workouts" | "exercises";

export default function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, paddingBottom: 80 }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Gymn</h1>
          <div style={{ color: "#666", marginTop: 4, fontSize: 14 }}>
            Workout templates • Schedule • Today
          </div>
        </header>

        <main
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
            background: "#fff",
          }}
        >

          {tab === "today" && <TodayPage />}
          {tab === "schedule" && <SchedulePage />}
          {tab === "workouts" && <WorkoutsPage />}
          {tab === "exercises" && <ExercisesPage />}
        </main>
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function BottomNav({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "12px 8px",
    border: "none",
    background: active ? "#111" : "#f3f3f3",
    color: active ? "#fff" : "#111",
    fontWeight: 600,
  });

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: "1px solid #ddd",
        display: "flex",
        gap: 1,
        background: "#ddd",
      }}
    >
      <button style={btnStyle(tab === "today")} onClick={() => setTab("today")}>
        Today
      </button>
      <button
        style={btnStyle(tab === "schedule")}
        onClick={() => setTab("schedule")}
      >
        Schedule
      </button>
      <button
        style={btnStyle(tab === "workouts")}
        onClick={() => setTab("workouts")}
      >
        Workouts
      </button>
      <button
        style={btnStyle(tab === "exercises")}
        onClick={() => setTab("exercises")}
      >
        Exercises
      </button>
    </nav>
  );
}
