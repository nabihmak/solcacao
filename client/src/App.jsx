/**
 * Client-side routing shell.
 * Every page lives under a language prefix: /en/... or /es/...
 * Example: /en/catalog and /es/catalog show the same page in two languages.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import LangLayout from './components/layout/LangLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import B2BPage from './pages/B2BPage';
import B2BQuotePage from './pages/B2BQuotePage';
import ContactPage from './pages/ContactPage';
import SupportPage from './pages/SupportPage';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
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
