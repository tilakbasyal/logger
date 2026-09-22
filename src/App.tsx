import {
  useState,
} from "react";

import AddShiftPage from "./pages/AddShiftPage";
import ShiftHistoryPage from "./pages/ShiftHistoryPage";
import DashboardPage from "./pages/DashboardPage";
import ShiftPresetsPage from "./pages/ShiftPresetsPage";

type Page =
  "dashboard"
  | "add"
  | "history"
  | "presets";

function App() {
  const [page, setPage] =
    useState<Page>("dashboard");

  return (
    <>
      <nav className="app-navigation">
        <button
          type="button"
          className={
            page === "dashboard"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
        Dashboard
        </button>
        <button
          type="button"
          className={
            page === "add"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("add")
          }
        >
          Add Work
        </button>

        <button
          type="button"
          className={
            page === "history"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setPage("history")
          }
        >
          History
        </button>

        <button
          className={
            page === "presets"
              ? "active"
              : ""
          }
          onClick={() =>
            setPage("presets")
          }
        >
          Presets
        </button>
      </nav>

      {page === "dashboard" && (
        <DashboardPage />
      )}

      {page === "add" && (
        <AddShiftPage />
      )}

      {page === "history" && (
        <ShiftHistoryPage />
      )}

      {page === "presets" && (
        <ShiftPresetsPage />
      )}
    </>
  );
}

export default App;