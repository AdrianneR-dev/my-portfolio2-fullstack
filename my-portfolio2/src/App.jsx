import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './views/Home.jsx'
import Projects from './views/Projects.jsx'
import Experience from './views/Experience.jsx'
import Contact from './views/Contact.jsx'
import Guestbook from './views/Guestbook.jsx'
import Login from './views/Login.jsx'
import Register from './views/Register.jsx'
import Admin from './views/Admin.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/Experience" element={<Experience />}/>
          <Route path="/Projects" element={<Projects />}/>
          <Route path="/Guestbook" element={<Guestbook />}/>
          <Route path="/Contact" element={<Contact />}/>
          <Route path="/Login" element={<Login />}/>
          <Route path="/Register" element={<Register />}/>
          <Route path="/Admin" element={<RequireAdmin><Admin /></RequireAdmin>}/>
        </Routes>
      </main>
      <Footer/>
    </BrowserRouter>
  )
}

export default App
