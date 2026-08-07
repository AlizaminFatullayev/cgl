import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { AppLayout } from '@/components/AppLayout'
import { PublicLayout } from '@/components/PublicLayout'
import { RequireAdmin } from '@/components/RequireAdmin'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { HomePage } from '@/pages/public/HomePage'
import { ServicesPage } from '@/pages/public/ServicesPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { CalculatorPage } from '@/pages/public/CalculatorPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { VehiclesPage } from '@/pages/dashboard/VehiclesPage'
import { AddVehiclePage } from '@/pages/dashboard/AddVehiclePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth screens, outside both layouts */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public marketing site -- works signed out */}
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
          </Route>

          {/* Signed-in area */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/vehicles/new" element={<AddVehiclePage />} />

              {/* Prompt B / later phases */}
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
