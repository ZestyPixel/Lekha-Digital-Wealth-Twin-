import './App.css'
import LoginForm from './pages/login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/layout/navbar/NavBar'
import Hamburger from './components/layout/hamburgerMenu/HamburgerMenu'
import Footer from './components/layout/footer/Footer'
import HomePage from './pages/Homepage'
import SignupForm from './pages/signUp'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<SignupForm />} />
        <Route path='/login' element={<LoginForm />} />
        
        <Route path='/*' element={
          <div className="app">
            <header className="app-header">
              <Navbar onToggleSidebar={toggleSidebar} />
            </header>
            
            <Hamburger isOpen={sidebarOpen} />
            
            <main className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <Routes>
                <Route path="/homepage" element={<HomePage />} />
                {/* Add more routes here */}
              </Routes>
            </main>
            
            <footer className={`app-footer ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <Footer />
            </footer>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App