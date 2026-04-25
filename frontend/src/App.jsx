import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { ThemeToggle } from "./components/ThemeToggle";

export default function App() {
  return (
    <>
      <ThemeToggle />
      <RouterProvider router={router} />
    </>
  );
}