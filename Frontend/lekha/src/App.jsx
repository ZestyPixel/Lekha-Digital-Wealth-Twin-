import './App.css'
import LoginForm from './pages/login/LoginForm';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/layout/navbar/NavBar'
import Hamburger from './components/layout/hamburgerMenu/HamburgerMenu'
import Footer from './components/layout/footer/Footer'
import HomePage from './pages/homepage/Homepage'
import SignupForm from './pages/signup/SignUpPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthProvider';
import RecentTransactions from './pages/recenttransaction/LastTransaction';
import NetWorth from './pages/networth/NetWorth';
import MonthlyExpenses from './pages/monthlyexpenses/MonthlyExpenses';
import Goals from './pages/goals/Goals';
import Profile from './pages/profile/Profile';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes without layout */}
          <Route path="/" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          
          {/* Layout wrapper for all authenticated routes */}
          <Route path="/*" element={
            <div className="app">
              <header className="app-header">
                <Navbar onToggleSidebar={toggleSidebar} />
              </header>
              
              <Hamburger isOpen={sidebarOpen} />
              
              <main className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Routes>
                  <Route path="/homepage" element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path='/recenttransactions' element={
                    <ProtectedRoute>
                      <RecentTransactions/>
                    </ProtectedRoute>
                  }/>

                  <Route path="/networth" element={
                    <ProtectedRoute>
                      <NetWorth/>
                    </ProtectedRoute>
                  } />
                  <Route path="/monthlyexpenses" element={
                    <ProtectedRoute>
                      <MonthlyExpenses/>
                    </ProtectedRoute>
                  } />
                  <Route path="/goals" element={
                    <ProtectedRoute>
                      <Goals/>
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile/>
                    </ProtectedRoute>
                  } />
                  {/* Catch-all for authenticated routes */}
                  <Route path="*" element={
                    <ProtectedRoute>
                      <div>Page not found</div>
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              
              <footer className={`app-footer ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Footer />
              </footer>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App