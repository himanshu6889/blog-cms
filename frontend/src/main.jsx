import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./editor/styles.css";
import App from "./App";
import { initCsrf } from "./utils/csrfUtils"; // CSRF init

//  Fetch CSRF token BEFORE the app renders
// Stored in memory — XSS cannot steal it (unlike localStorage)
initCsrf().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
