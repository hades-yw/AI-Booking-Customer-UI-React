import type { RouteObject } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { BookingPage } from "./pages/BookingPage";
import { BookingReceiptPage } from "./pages/BookingReceiptPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { MerchantDetailPage } from "./pages/MerchantDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

export const routes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/merchants/:merchantId", element: <MerchantDetailPage /> },
  { path: "/merchants/:merchantId/book", element: <BookingPage /> },
  { path: "/merchants/:merchantId/confirm", element: <ConfirmationPage /> },
  { path: "/merchants/:merchantId/checkout", element: <CheckoutPage /> },
  { path: "/merchants/:merchantId/booking/:bookingRef", element: <BookingReceiptPage /> },
  { path: "/login", element: <AuthPage /> },
  { path: "/register", element: <AuthPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "*", element: <NotFoundPage /> },
];
