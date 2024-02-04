import './App.css'
import { Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar/Navbar'
import { Footer } from './components/Footer/Footer'
import { ChatPage } from './pages/ChatPage/ChatPage'
import { NotFound } from './pages/NotFound/NotFound'
import { RegisterAndLogin } from './pages/RegisterAndLogin/RegisterAndLogin'
import axios from 'axios'



function App() {

  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
  axios.defaults.withCredentials = true;

  return (

      <>
        <Navbar />
        <Routes>
          <Route exact path='/' element={<RegisterAndLogin />} />
          <Route exact path='/chat' element={<ChatPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </>

  )
}

export default App
