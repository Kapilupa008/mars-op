import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RequireUsername = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username;

  if (!username) {
    const promptName = prompt('Enter your name:') || 'Anonymous';
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, username: promptName },
    });
    return null; // Prevent rendering until username is set
  }

  return children;
};

export default RequireUsername;
