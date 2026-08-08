import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from '@/auth/AuthProvider'
import { AdminLayout } from '@/components/AdminLayout'
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
import { TrackingPage } from '@/pages/public/TrackingPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { VehiclesPage } from '@/pages/dashboard/VehiclesPage'
import { AddVehiclePage } from '@/pages/dashboard/AddVehiclePage'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminVehiclesPage } from '@/pages/admin/AdminVehiclesPage'
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage'
import { AdminRatesPage } from '@/pages/admin/AdminRatesPage'
import { AdminInvoicesPage } from '@/pages/admin/AdminInvoicesPage'
import { AdminMessagesPage } from '@/pages/admin/AdminMessagesPage'

export default function App() {
  /*
    Subscribes the whole tree to language changes. Helpers like statusLabel()
    and formatCurrency() read the active locale outside React, so without this
    a switch would leave already-rendered labels stale.
  */
  useTranslation()

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
            <Route path="/tracking" element={<TrackingPage />} />
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
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="vehicles" element={<AdminVehiclesPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="rates" element={<AdminRatesPage />} />
                  <Route path="invoices" element={<AdminInvoicesPage />} />
                  <Route path="messages" element={<AdminMessagesPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
