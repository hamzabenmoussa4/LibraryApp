import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/AppRoutes";
import "./index.css"; // 👈 TAILWIND DOIT ÊTRE ICI

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppRoutes />);
