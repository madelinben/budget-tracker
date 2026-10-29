import { createRoot } from "react-dom/client";
import { BudgetApp } from "../src";
import "./demo.css";

createRoot(document.getElementById("root") as HTMLElement).render(<BudgetApp />);
