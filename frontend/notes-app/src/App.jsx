import React from 'react'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';

const App = () => {
  return (
    <Router>
    <Routes>
      <Route path='/' exact element={<Login/>}></Route>
      <Route path='/dashboard' exact element={<Home></Home>}></Route>
      <Route path='/login' exact element={<Login/>}></Route>
      <Route path='/signup' exact element={<SignUp/>}></Route>
    </Routes>
  </Router>
  )
}

export default App
