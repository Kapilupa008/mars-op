import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from './socket';

const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [permission, setPermission] = useState('edit'); // ✅ default to edit
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId.trim() || !password.trim()) {
      setError('Please enter both Room ID and Password');
      return;
    }

    const username = prompt('Enter your name:') || 'Anonymous';

    // ✅ Include permission type in socket request
    socket.emit('join-room', { roomId, password, username, permission }, (response) => {
      if (response.success) {
        navigate(`/room/${roomId}`, {
          state: {
            isEditable: permission === 'edit', // ✅ grant edit access only if selected
            username,
            password, // optional: in case needed later
          },
        });
      } else {
        setError(response.message || 'Failed to join room');
      }
    });
  };

  return (
    <div style={{ padding: 30, maxWidth: 400, margin: 'auto' }}>
      <h2>Join Whiteboard Room</h2>

      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      {/* ✅ Access Permission Option */}
      <div style={{ marginBottom: 10 }}>
        <label>
          <input
            type="radio"
            name="permission"
            value="edit"
            checked={permission === 'edit'}
            onChange={() => setPermission('edit')}
          />{' '}
          Edit Access
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="permission"
            value="view"
            checked={permission === 'view'}
            onChange={() => setPermission('view')}
          />{' '}
          View-Only Access
        </label>
      </div>

      <button onClick={handleJoin} style={{ width: '100%', padding: 10 }}>
        🔐 Join Room
      </button>

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
    </div>
  );
};

export default JoinRoom;
