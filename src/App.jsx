import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import MainGame from './components/mainPage'; 
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing-page" element={<Landing />} />
        <Route path="/" element={<MainGame />} />
        <Route path="/about" element={<div>About Page</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;