import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CallProvider } from './context/CallContext';
import Chat from './components/Chat/Chat';
import './App.css';

function App() {
  return (
    <Router>
      <CallProvider>
        <div className="App">
          <Routes>
            <Route path="/chat/:chatId" element={<Chat />} />
            {/* Other routes */}
          </Routes>
        </div>
      </CallProvider>
    </Router>
  );
}

export default App; 