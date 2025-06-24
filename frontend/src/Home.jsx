import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomId.trim() !== '' && password.trim() !== '') {
      navigate(`/room/${roomId}?password=${password}`);
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${id}?password=admin`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Join or Create a Whiteboard Room</h2>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      /><br /><br />
      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />
      <button onClick={handleJoin}>🔗 Join Room</button>
      <button onClick={generateRoomId}>🆕 Create New Room</button>
    </div>
  );
};

export default Home;
