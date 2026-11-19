/**
 * Client-side routing shell.
 * Every page lives under a language prefix: /en/... or /es/...
 * Example: /en/catalog and /es/catalog show the same page in two languages.
 */
import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LangLayout from './components/layout/LangLayout';
import HomePage from './pages/HomePage';

// Phase 4: every page except the home page is loaded on demand (code splitting),
// so the first visit downloads only the shell and the home page. The loading
// boundary is in LangLayout, so the navbar and footer stay on screen.
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const B2BPage = lazy(() => import('./pages/B2BPage'));
const B2BQuotePage = lazy(() => import('./pages/B2BQuotePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Visiting "/" sends the user to the English home page */}
      <Route path="/" element={<Navigate to="/en" replace />} />

      <Route path="/:lang" element={<LangLayout />}>
        <Route index element={<HomePage />} />
        {/* Student 3: catalog and product pages */}
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:slug" element={<ProductDetailPage />} />
        {/* Student 3: checkout and orders (signed-in users only) */}
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:reference"
          element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
        {/* Student 4: wholesale services and the partner-only quote wizard */}
        <Route path="b2b" element={<B2BPage />} />
        <Route
          path="b2b/quote"
          element={
            <ProtectedRoute accountType="B2B">
              <B2BQuotePage />
            </ProtectedRoute>
          }
        />
        <Route path="contact" element={<ContactPage />} />
        <Route path="feedback" element={<SupportPage type="feedback" />} />
        <Route path="sampler" element={<SupportPage type="sampler" />} />
        <Route path="about" element={<InfoPage type="about" />} />
        <Route path="faq" element={<InfoPage type="faq" />} />

        {/* Student 1: registration and profile management */}
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
