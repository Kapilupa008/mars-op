import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinRoom from './JoinRoom';
import Whiteboard from './Whiteboard';
import RequireUsername from './RequireUsername';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route
          path="/room/:roomId"
          element={
            <RequireUsername>
              <Whiteboard />
            </RequireUsername>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
