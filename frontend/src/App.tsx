import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import Requests from './pages/Requests'
import Profile from './pages/Profile'
import AddItem from './pages/AddItem'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/items/:id" element={<ItemDetail />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/items/new" element={<AddItem />} />
    </Routes>
  )
}

export default App
