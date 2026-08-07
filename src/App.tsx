import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { AppLayout } from '@/components/AppLayout'
import { RequireAdmin } from '@/components/RequireAdmin'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Signed-in area */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={<PlaceholderPage name="Dashboard" />}
              />
              <Route
                path="/vehicles"
                element={<PlaceholderPage name="Vehicles" />}
              />
              <Route
                path="/invoices"
                element={<PlaceholderPage name="Invoices" />}
              />
              <Route
                path="/transactions"
                element={<PlaceholderPage name="Transactions" />}
              />

              {/* Admin-only area, nested inside the signed-in gate */}
              <Route element={<RequireAdmin />}>
                <Route
                  path="/admin"
                  element={<PlaceholderPage name="Admin" />}
                />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
