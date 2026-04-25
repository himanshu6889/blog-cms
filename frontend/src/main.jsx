import React from "react";
import ReactDOM from "react-dom/client";
import router from "./routes";
import "./index.css";
import "./editor/styles.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
