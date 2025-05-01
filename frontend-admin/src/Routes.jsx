import { useSelector } from "react-redux";
import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import Login from "./pages/login/Login.jsx";
import Dashboard from "./pages/dashboard/Overview.jsx";
import AddTrack from "./pages/products/AddTrack.jsx";
import EditTrack from "./pages/products/EditTrack.jsx";
import ManageTrack from "./pages/products/ManageTrack.jsx";
import AddOrder from "./pages/orders/AddOrder.jsx";
import ManageOrder from "./pages/orders/ManageOrder.jsx";
import ManageOrders from "./pages/orders/ManageOrders.jsx";

import AddCustomer from "./pages/customers/AddCustomer.jsx";
import EditCustomer from "./pages/customers/EditCustomer.jsx";
import ManageUser from "./pages/customers/ManageUser.jsx";

// Import artist components
import AddArtist from "./pages/artists/AddArtist.jsx";
import EditArtist from "./pages/artists/EditArtist.jsx";
import ManageArtist from "./pages/artists/ManageArtist.jsx";

import AddGenre from "./pages/genres/AddGenre.jsx";
import EditGenre from "./pages/genres/EditGenre.jsx";
import ManageGenre from "./pages/genres/ManageGenre.jsx";
import * as Icons from "react-icons/tb";
import { useEffect } from "react";

// Component đơn giản cho trang yêu cầu đăng nhập
const LoginRequired = () => (
  <div style={{ padding: "20px", textAlign: "center" }}>
    <h2>Đăng nhập yêu cầu</h2>
    <p>Bạn cần đăng nhập từ trang chính để truy cập vào khu vực quản trị.</p>
    <Link to="http://localhost:3000" style={{ color: "lightblue" }}>
      Đi đến trang đăng nhập
    </Link>
  </div>
);

// Component đơn giản cho trang không có quyền truy cập
const Unauthorized = () => (
  <div style={{ padding: "20px", textAlign: "center" }}>
    <h2>Không được phép</h2>
    <p>Tài khoản của bạn không có quyền truy cập vào khu vực này.</p>
    <Link to="http://localhost:3000" style={{ color: "lightblue" }}>
      Quay lại trang chính
    </Link>
  </div>
);

// Component đơn giản cho trang lỗi
const ErrorPage = () => (
  <div style={{ padding: "20px", textAlign: "center" }}>
    <h2>Đã xảy ra lỗi</h2>
    <p>Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.</p>
    <Link to="http://localhost:3000" style={{ color: "lightblue" }}>
      Quay lại trang chính
    </Link>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Route cha sử dụng Layout cho các trang cần xác thực */}
      <Route element={<Layout />}>
        {/* Dashboard route */}
        <Route path="/" element={<Dashboard />} />

        {/* Track Routes */}
        <Route path="/tracks/manage" element={<ManageTrack />} />
        <Route path="/tracks/add" element={<AddTrack />} />
        <Route path="/tracks/edit/:id" element={<EditTrack />} />

        {/* User Routes */}
        <Route path="/users/add" element={<AddCustomer />} />
        <Route path="/users/manage" element={<ManageUser />} />
        <Route path="/users/edit/:userId" element={<EditCustomer />} />

        {/* Artist Routes - CORRECTLY NESTED */}
        <Route path="/artists/manage" element={<ManageArtist />} />
        <Route path="/artists/add" element={<AddArtist />} />
        <Route path="/artists/edit/:artistId" element={<EditArtist />} />

        {/* Genre Routes */}
        <Route path="/genres/manage" element={<ManageGenre />} />
        <Route path="/genres/add" element={<AddGenre />} />
        <Route path="/genres/edit/:genreId" element={<EditGenre />} />

        {/* Order Routes */}
        <Route path="/orders" element={<ManageOrders />} />
        <Route path="/orders/manage" element={<ManageOrder />} />
      </Route>

      {/* Routes without Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/login-required" element={<LoginRequired />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/error" element={<ErrorPage />} />
    </Routes>
  );
};

export default AppRoutes;
