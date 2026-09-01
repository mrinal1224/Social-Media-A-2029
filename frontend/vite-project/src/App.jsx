import './App.css'
import Login from './pages/Login.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Landing from './pages/Landing'
import Home from './pages/Home'
import { AuthProvider } from '../context/AuthContext'
import PublicRoute from '../components/PublicRoute'
import ProtectedRoute from '../components/ProtectedRoute'


function App() {


  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<PublicRoute><Landing/></PublicRoute>} />
            <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
            <Route path='/signup' element={<PublicRoute><SignUp /></PublicRoute>} />
            <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />


          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App
