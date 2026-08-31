import './App.css'
import Login from './pages/Login.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Landing from './pages/Landing'
import Home from './pages/Home'


function App() {


  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Landing/>}/>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/home' element={ <Home/>}/>


        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
