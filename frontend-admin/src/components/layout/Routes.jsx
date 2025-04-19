// // General
// import NotFound from "../../pages/error/NotFound"; // Commented out
// import Dashboard from "../../pages/dashboard/Overview"; // Commented out

// // Media
// import Media from "../../pages/media/Media.jsx"; // Commented out

// // Settings
// import Api from "../../pages/settings/Api"; // Commented out
// import Email from "../../pages/settings/Email"; // Commented out
// import General from "../../pages/settings/General"; // Commented out
// import CronJob from "../../pages/settings/CronJob"; // Commented out
// import Permalink from "../../pages/settings/Permalink"; // Commented out
// import Languages from "../../pages/settings/Languages"; // Commented out
// import SocialLogin from "../../pages/settings/SocialLogin"; // Commented out

// Products (Keep these)
import Attribute from "../../pages/products/Attribute";
import AddProduct from "../../pages/products/AddProduct";
import EditProduct from "../../pages/products/EditProduct";
import ManageProduct from "../../pages/products/ManageProduct";

// // Orders (Commented out)
// import AddOrder from "../../pages/orders/AddOrder";
// import ManageOrder from "../../pages/orders/ManageOrder";
// import OrderDetail from "../../pages/orders/OrderDetail";

// // brand (Commented out)
// import AddBrand from "../../pages/brands/AddBrand";
// import ManageBrand from "../../pages/brands/ManageBrand";
// import EditBrand from "../../pages/brands/EditBrand";

// Customer (Keep these)
import AddCustomer from "../../pages/customers/AddCustomer";
import EditCustomer from "../../pages/customers/EditCustomer";
import ManageUser from "../../pages/customers/ManageUser.jsx";

// // Users (Assume related to Customers, keep for now - can be removed if unused)
// import AddUser from "../../pages/users/AddUser";
// import EditUser from "../../pages/users/EditUser";
// import UserList from "../../pages/users/UserList";

// // Venue (Commented out)
// import AddVenue from "../../pages/venue/AddVenue";
// import ManageVenue from "../../pages/venue/ManageVenue";

// // Categories (Commented out)
// import AddCategories from "../../pages/categories/AddCategories";
// import EditCategories from "../../pages/categories/EditCategories";
// import ManageCategories from "../../pages/categories/ManageCategories";

// // Reviews (Commented out)
// import ManageReviews from "../../pages/reviews/ManageReviews";
// import ReviewsDetail from "../../pages/reviews/ReviewsDetail";

// // Pages (Commented out)
// import AddPage from "../../pages/pages/AddPage";
// import EditPage from "../../pages/pages/EditPage";
// import ManagePages from "../../pages/pages/ManagePages";

// // Payment (Commented out)
// import ManageTransactions from "../../pages/payment/ManageTransactions";
// import PaymentMethod from "../../pages/payment/PaymentMethod";
// import TransactionDetail from "../../pages/payment/TransactionDetail";

// Sorting and Comments

const routes = [
  // {
  //   path: "/", // Comment out Dashboard route
  //   element: <Dashboard />,
  // },
  // Catalog
  {
    path: "/catalog/product/add",
    element: <AddProduct />,
  },
  {
    path: "/catalog/product/manage",
    element: <ManageProduct />,
  },
  {
    path: "/catalog/product/manage/:productId",
    element: <EditProduct />,
  },
  // {
  //   path: "/catalog/product/attribute", // Comment out Attribute route
  //   element: <Attribute />,
  // },
  // orders (Commented out)
  // {
  //   path: "/orders/add",
  //   element: <AddOrder />,
  // },
  // {
  //   path: "/orders/manage",
  //   element: <ManageOrder />,
  // },
  // {
  //   path: "/orders/manage/:orderID",
  //   element: <OrderDetail />,
  // },
  // Catalog Categories (Commented out)
  // {
  //   path: "/catalog/categories/manage",
  //   element: <ManageCategories />,
  // },
  // {
  //   path: "/catalog/categories/:categoryid",
  //   element: <EditCategories />,
  // },
  // customers -> Đổi thành users
  {
    path: "/users/add", // Đổi path
    element: <AddCustomer />, // Giữ nguyên component AddCustomer nếu file AddCustomer.jsx chưa đổi tên
  },
  {
    path: "/users/manage", // Đổi path
    element: <ManageUser />, // Component đã đúng
  },
  {
    path: "/users/edit/:userId", // Đổi path và param
    element: <EditCustomer />, // Giữ nguyên component EditCustomer nếu file EditCustomer.jsx chưa đổi tên
  },
  // brand (Commented out)
  // {
  //   path: "/brands/add",
  //   element: <AddBrand />,
  // },
  // {
  //   path: "/brands/manage",
  //   element: <ManageBrand />,
  // },
  // {
  //   path: "/brands/manage/:brandId",
  //   element: <EditBrand />,
  // },
  // Users (Commented out for now)
  // {
  //   path: "/users/list",
  //   element: <UserList />,
  // },
  // {
  //   path: "/users/add",
  //   element: <AddUser />,
  // },
  // {
  //   path: "/users/list/:userid",
  //   element: <EditUser />,
  // },
  // Venue (Commented out)
  // {
  //   path: "/venue/add",
  //   element: <AddVenue />,
  // },
  // {
  //   path: "/venue/manage",
  //   element: <ManageVenue />,
  // },
  // Reviews (Commented out)
  // {
  //   path: "/reviews",
  //   element: <ManageReviews />,
  // },
  // {
  //   path: "/reviews/:reviewid",
  //   element: <ReviewsDetail />,
  // },
  // Pages (Commented out)
  // {
  //   path: "/pages",
  //   element: <ManagePages />,
  // },
  // {
  //   path: "/pages/add",
  //   element: <AddPage />,
  // },
  // {
  //   path: "/pages/:pageId",
  //   element: <EditPage />,
  // },
  // Payment (Commented out)
  // {
  //   path: "/payment/transactions",
  //   element: <ManageTransactions />,
  // },
  // {
  //   path: "/payment/transactions/:transactionId",
  //   element: <TransactionDetail />,
  // },
  // {
  //   path: "/payment/payment-method",
  //   element: <PaymentMethod />,
  // },
  // Media (Commented out)
  // {
  //   path: "/media",
  //   element: <Media />,
  // },
  // Settings (Commented out)
  // {
  //   path: "/setting/general",
  //   element: <General />,
  // },
  // {
  //   path: "/setting/email",
  //   element: <Email />,
  // },
  // {
  //   path: "/setting/cronJob",
  //   element: <CronJob />,
  // },
  // {
  //   path: "/setting/permalink",
  //   element: <Permalink />,
  // },
  // {
  //   path: "/setting/languages",
  //   element: <Languages />,
  // },
  // {
  //   path: "/setting/social-login",
  //   element: <SocialLogin />,
  // },
  // {
  //   path: "/setting/api",
  //   element: <Api />,
  // },
  // Not Found (Commented out)
  // {
  //   path: "*",
  //   element: <NotFound />,
  // },
];

export default routes;