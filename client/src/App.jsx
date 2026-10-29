/**
 * Client-side routing shell.
 * Every page lives under a language prefix: /en/... or /es/...
 * Example: /en/catalog and /es/catalog show the same page in two languages.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import LangLayout from './components/layout/LangLayout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import B2BPage from './pages/B2BPage';
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
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="b2b" element={<B2BPage />} />
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
