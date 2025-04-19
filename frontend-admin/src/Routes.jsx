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

import AddCustomer from "./pages/customers/AddCustomer.jsx";
import EditCustomer from "./pages/customers/EditCustomer.jsx";
import ManageUser from "./pages/customers/ManageUser.jsx";

// Component đơn giản cho trang yêu cầu đăng nhập
const LoginRequired = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Đăng nhập yêu cầu</h2>
    <p>Bạn cần đăng nhập từ trang chính để truy cập vào khu vực quản trị.</p>
    <Link to="http://localhost:3000" style={{ color: 'lightblue' }}>
      Đi đến trang đăng nhập
    </Link>
  </div>
);

// Component đơn giản cho trang không có quyền truy cập
const Unauthorized = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Không được phép</h2>
    <p>Tài khoản của bạn không có quyền truy cập vào khu vực này.</p>
    <Link to="http://localhost:3000" style={{ color: 'lightblue' }}>
      Quay lại trang chính
    </Link>
  </div>
);

// Component đơn giản cho trang lỗi
const ErrorPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Đã xảy ra lỗi</h2>
    <p>Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.</p>
    <Link to="http://localhost:3000" style={{ color: 'lightblue' }}>
      Quay lại trang chính
    </Link>
  </div>
);

const AppRoutes = () => {
  console.log("AppRoutes component is rendering..."); 

  return (
    <Routes>
      {/* Route cha sử dụng Layout cho các trang cần xác thực */}
      <Route element={<Layout />}>
        {/* Comment out Dashboard route */}
        <Route path="/" element={<Dashboard />} />
        {/* Track Routes - Sửa path và element */}
        <Route path="/tracks/manage" element={<ManageTrack />} />
        <Route path="/tracks/add" element={<AddTrack />} />
        <Route path="/tracks/edit/:id" element={<EditTrack />} />
        {/* Comment out Product Routes - Xóa hoặc comment các dòng cũ
        <Route path="/products/manage" element={<ManageProduct />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />
        */}
        {/* Comment out Category Routes */}
        {/* <Route path="/categories/manage" element={<ManageCategory />} /> */}
        {/* <Route path="/categories/add" element={<AddCategory />} /> */}
        {/* <Route path="/categories/edit/:id" element={<EditCategory />} /> */}
        {/* Comment out Attribute Routes */}
        {/* <Route path="/attributes/manage" element={<ManageAttribute />} /> */}
        {/* USER ROUTES */}
        <Route path="/users/manage" element={<ManageUser />} />
        <Route path="/users/add" element={<AddCustomer />} />
        <Route path="/users/edit/:id" element={<EditCustomer />} />
        {/* Order Routes */}
        <Route path="/orders/manage" element={<ManageOrder />} />
        <Route path="/orders/add" element={<AddOrder />} />
        {/* Comment out EditOrder route */}
        {/* <Route path="/orders/edit/:id" element={<EditOrder />} /> */}
      </Route>

      {/* Route cho Login và các trang không cần Layout */}
      {/* Layout sẽ tự xử lý việc hiển thị Login nếu chưa xác thực */} 
      {/* Nếu muốn có route /login riêng biệt không qua Layout thì để ở đây */}
      <Route path="/login" element={<Login />} />
      {/* Thêm các route mới */}
      <Route path="/login-required" element={<LoginRequired />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/error" element={<ErrorPage />} />

      {/* Remove Not Found Route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default AppRoutes;