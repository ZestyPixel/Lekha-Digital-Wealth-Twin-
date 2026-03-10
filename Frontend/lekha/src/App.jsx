import './App.css'
import LoginForm from './pages/login/LoginForm';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion';
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
import ManageWealth from './pages/wealth/ManageWealth';
import LumpsumInvestment from './pages/wealth/LumpForm';
import SIPInvestment from './pages/wealth/SipForm';
import TransferWithdraw from './pages/wealth/TransferWithdrawForm';
import ChatBot from './components/chatbot/ChatBot';

// Wraps each page with fade + slide animation
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}

//We wrote the routes in a separate component so that we can use the useLocation hook which can only be used inside a component that is rendered by a Route. 
// This allows us to animate the route transitions using AnimatePresence from framer-motion. 
// The key prop on Routes ensures that the animation runs whenever the route changes.
function AnimatedRoutes() { 
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
    {/* <AnimatePresence mode="wait"> // The mode="wait" prop ensures that the exit animation of the current page completes before the next page enters, 
    preventing overlap of animations during route transitions. */}
      <Routes location={location} key={location.pathname}>
        <Route path="/homepage" element={
          <ProtectedRoute>
            <PageWrapper><HomePage /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path='/recenttransactions' element={
          <ProtectedRoute>
            <PageWrapper><RecentTransactions /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/networth" element={
          <ProtectedRoute>
            <PageWrapper><NetWorth /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/monthlyexpenses" element={
          <ProtectedRoute>
            <PageWrapper><MonthlyExpenses /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/goals" element={
          <ProtectedRoute>
            <PageWrapper><Goals /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <PageWrapper><Profile /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/wealth" element={
          <ProtectedRoute>
            <PageWrapper><ManageWealth /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/sip" element={
          <ProtectedRoute>
            <PageWrapper><SIPInvestment /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/lump" element={
          <ProtectedRoute>
            <PageWrapper><LumpsumInvestment /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="/transfer" element={
          <ProtectedRoute>
            <PageWrapper><TransferWithdraw /></PageWrapper>
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <ProtectedRoute>
            <PageWrapper><div>Page not found</div></PageWrapper>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
              <ChatBot />

              <main className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <AnimatedRoutes /> {/* This component contains all the routes that we want to animate between. */}
              </main>

              <footer className={`app-footer ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Footer />
              </footer>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;