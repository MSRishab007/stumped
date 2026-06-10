import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing';
import MainGame from './components/mainPage'; 
import './App.css';

// --- 1. THE DAILY GUARD COMPONENT ---
const DailyRedirectGuard = ({ children }) => {
  const today = new Date().toLocaleDateString();
  
  // Check local storage for the last recorded visit
  const lastVisit = localStorage.getItem('stumped_last_visit');

  // If they haven't visited today
  if (lastVisit !== today) {
    // Record today's date so they don't get redirected again today
    localStorage.setItem('stumped_last_visit', today);
    
    // Send them to the landing page
    return <Navigate to="/landing-page" replace />;
  }

  // If they HAVE visited today, render the game normally
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unprotected Routes */}
        <Route path="/landing-page" element={<Landing />} />
        <Route path="/today" element={<Landing />} />
        <Route path="/about" element={<div>About Page</div>} />

        {/* --- 2. PROTECTED MAIN GAME ROUTE --- */}
        <Route 
          path="/" 
          element={
            <DailyRedirectGuard>
              <MainGame />
            </DailyRedirectGuard>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;