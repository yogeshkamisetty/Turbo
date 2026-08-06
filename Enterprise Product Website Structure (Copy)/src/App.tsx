import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './dashboard/DashboardLayout'
import Home from './dashboard/Home'
import Chargers from './dashboard/Chargers'
import ChargingSessions from './dashboard/ChargingSessions'
import LiveGrid from './dashboard/LiveGrid'
import Vehicles from './dashboard/Vehicles'
import Drivers from './dashboard/Drivers'
import Tenants from './dashboard/Tenants'
import Billing from './dashboard/Billing'
import Reports from './dashboard/Reports'
import Alerts from './dashboard/Alerts'
import Settings from './dashboard/Settings'
import Profile from './dashboard/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="chargers" element={<Chargers />} />
          <Route path="sessions" element={<ChargingSessions />} />
          <Route path="grid" element={<LiveGrid />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
