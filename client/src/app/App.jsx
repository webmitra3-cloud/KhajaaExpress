import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Vendors from "../pages/Vendors";
import VendorDetail from "../pages/VendorDetail";
import CartPage from "../pages/CartPage";
import Checkout from "../pages/Checkout";
import Payment from "../pages/Payment";
import Orders from "../pages/Orders";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VendorSignup from "../pages/VendorSignup";
import VendorLayout from "../pages/VendorLayout";
import VendorDashboardPage from "../pages/VendorDashboardPage";
import VendorOrdersPage from "../pages/VendorOrdersPage";
import VendorMenuPage from "../pages/VendorMenuPage";
import VendorFinancePage from "../pages/VendorFinancePage";
import VendorExpensesPage from "../pages/VendorExpensesPage";
import VendorReportsPage from "../pages/VendorReportsPage";
import VendorSettingsPage from "../pages/VendorSettingsPage";
import AdminLayout from "../pages/AdminLayout";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminVendorsPage from "../pages/AdminVendorsPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminFinancePage from "../pages/AdminFinancePage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import AdminTicketsPage from "../pages/AdminTicketsPage";
import AdminCouponsPage from "../pages/AdminCouponsPage";
import AdminBannersPage from "../pages/AdminBannersPage";
import AdminReportsPage from "../pages/AdminReportsPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import Account from "../pages/Account";
import ProtectedRoute from "./ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/vendors/:slug" element={<VendorDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/vendor-signup" element={<VendorSignup />} />
        <Route
          path="/vendor"
          element={
            <ProtectedRoute roles={["VENDOR"]}>
              <VendorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<VendorDashboardPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="menu" element={<VendorMenuPage />} />
          <Route path="finance" element={<VendorFinancePage />} />
          <Route path="expenses" element={<VendorExpensesPage />} />
          <Route path="reports" element={<VendorReportsPage />} />
          <Route path="settings" element={<VendorSettingsPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="vendors" element={<AdminVendorsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="finance" element={<AdminFinancePage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
