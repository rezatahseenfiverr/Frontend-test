import { createBrowserRouter } from "react-router-dom";
import Layout from "../layout/Layout";
import AdminLayout from "../layout/AdminLayout";
import UserLayout from "../layout/UserLayout";
import AdminRoutes from "./AdminRoutes";

// Pages
import Home from "../pages/Home";
import ContactUs from "../pages/ContactUs";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";
import Products from "../pages/Products";
import ProductView from "../pages/ProductView";
import CartPage from "../pages/Cart";
import CheckoutPage from "../pages/Checkout";
import UserProfile from "../pages/User";
import OrdersUser from "../pages/OrdersUser";
import OrderDetails from "../pages/OrderDetails";
import OrderConfirmationPage from "../pages/OrderConfirmation";
import WishlistPage from "../pages/WishlistPage";

import AdminLogin from "../pages/AdminLogin";
import AdminDashBoard from "../pages/AdminDashBoard";
import Dashboard from "../pages/Dashboard";
import AdminCrudPage from "../pages/AdminCrudPage";
import AdminProfile from "../pages/AdminProfile";
import UserCrudPage from "../pages/UserCrudPage";
import ProductAdminPage from "../pages/ProductAdminPage";
import ChatList from "../pages/ChatList";
import MessagePage from "../pages/MessagePage";
import ProductCRUDPage from "../pages/ProductCrudPage";
import ProductEdit from "../pages/ProductEdit";
import ColorManagement from "../pages/Colors";
import SizeManagement from "../pages/Sizes";
import CategoryManagement from "../pages/Categories";
import GenderManagement from "../pages/Gender";
import ProductCreate from "../pages/ProductCreate";
import BadgeManagement from "../pages/Badges";
import CouponManagement from "../pages/Coupon";
import SliderManagement from "../pages/AdminSlides";
import TopRatedSlidesManagement from "../pages/AdminTopRatedSlides";
import RelatedProductManagement from "../pages/RelatedProduct";
import MeasureTypeAdminPage from "../pages/MeasureType";
import AdminOrdersPage from "../pages/OrderAdmin";
import ShippingAdmin from "../pages/ShippingAdmin";
import PopupAdManagement from "../pages/AdminPopupAds";
import BrandManagement from "../pages/AdminBrands";
import AdminContacts from "../pages/AdminContacts";
import NotFound from "../pages/NotFound";
import AdminInventory from "../pages/AdminInventory";
import AdminPOS from "../pages/AdminPOS";
import AdminPOSOrders from "../pages/AdminPOSOrders";
import AdminWishlists from "../pages/AdminWishlists";
import AdminSeoAi from "../pages/AdminSeoAi";
import { POSProvider } from "../context/POSContext";
import QRScannerTest from "../components/QRScannerTest";
import ForgotPassword from "../components/ForgotPassword";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/home", element: <Home /> },
      { path: "/products", element: <Products /> },
      { path: "/products/:id", element: <ProductView /> },
      { path: "/contactus", element: <ContactUs /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <SignUp /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/qr-test", element: <QRScannerTest /> },
      { path: "/wishlist", element: <WishlistPage /> },
      {
        path: "/profile",
        element: <UserLayout />,
        children: [
          { index: true, element: <UserProfile /> },
          { path: "orders", element: <OrdersUser /> },
          { path: "orders/:orderId", element: <OrderDetails /> },
          { path: "orders/order-confirmation/:orderId", element: <OrderConfirmationPage /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminLogin /> }, // Public login page
      {
        element: <AdminRoutes />, // Protect all child admin routes
        children: [
          {
            path: "dashboard",
            element: <AdminDashBoard />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: "admins", element: <AdminCrudPage /> },
              { path: "profile", element: <AdminProfile /> },
              { path: "users", element: <UserCrudPage /> },
              { path: "products", element: <ProductAdminPage /> },
              { path: "inbox", element: <ChatList /> },
              { path: "inbox/:id", element: <MessagePage /> },
              { path: "products/products", element: <ProductCRUDPage /> },
              { path: "products/products/:id", element: <ProductEdit /> },
              { path: "products/colors", element: <ColorManagement /> },
              { path: "products/sizes", element: <SizeManagement /> },
              { path: "products/categories", element: <CategoryManagement /> },
              { path: "products/gender", element: <GenderManagement /> },
              { path: "products/products/createproducts", element: <ProductCreate /> },
              { path: "products/badges", element: <BadgeManagement /> },
              { path: "products/coupons", element: <CouponManagement /> },
              { path: "products/slides", element: <SliderManagement /> },
              { path: "products/top-rated", element: <TopRatedSlidesManagement /> },
              { path: "products/related", element: <RelatedProductManagement /> },
              { path: "products/measure-type", element: <MeasureTypeAdminPage /> },
              { path: "products/shipping", element: <ShippingAdmin /> },
              { path: "products/brands", element: <BrandManagement /> },
              { path: "products/popup-ads", element: <PopupAdManagement /> },
              { path: "orders", element: <AdminOrdersPage /> },
              { path: "contacts", element: <AdminContacts /> },
              { path: "inventory", element: <AdminInventory /> },
              { path: "pos", element: <POSProvider><AdminPOS /></POSProvider> },
              { path: "pos-orders", element: <AdminPOSOrders /> },
              { path: "qr-test", element: <QRScannerTest /> },
              { path: "wishlists", element: <AdminWishlists /> },
              { path: "seo-ai", element: <AdminSeoAi /> },
            ],
          },
        ],
      },
    ],
  },
  // Catch-all route for 404
  {
    path: "*",
    element: <NotFound />,
  },
]);
