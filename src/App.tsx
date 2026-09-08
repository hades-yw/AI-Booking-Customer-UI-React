import { useRoutes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BookingFlowProvider } from "./context/BookingFlowContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { routes } from "./routes";

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BookingFlowProvider>
          <AppRoutes />
        </BookingFlowProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
