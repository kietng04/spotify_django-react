import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; 
import { login, logout } from './store/slices/authenticationSlice.jsx';
import AppRoutes from './Routes.jsx';
import './styles/style.min.css'

// Tạo một component nội bộ để sử dụng các hook của Router
const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log("Admin Token from URL:", token);
      
      const verifyAdminToken = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/validate-token', { 
            method: 'GET',
            headers: {
              'Authorization': `Token ${token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) { 
              console.error("Admin verification failed: Invalid token or access denied.");
            } else {
              console.error(`Admin verification API error: ${response.status} ${response.statusText}`);
            }
            dispatch(logout());
            navigate('/login-required', { replace: true });
            return;
          }

          const data = await response.json();

          if (data.is_superuser) {
            console.log("Token verified, user is superuser.");
            localStorage.setItem('adminAuthToken', token);
            dispatch(login({ token, user: data }));
          } else {
            console.error("Admin verification failed: User is not a superuser.");
            dispatch(logout());
            navigate('/unauthorized', { replace: true });
          }

        } catch (error) {
          console.error("Error calling verification API:", error);
          dispatch(logout());
          navigate('/error', { replace: true });
        }
      };

      verifyAdminToken();

      navigate(location.pathname, { replace: true });
    } else {
        const storedToken = localStorage.getItem('adminAuthToken');
        if (storedToken) {
            console.log("Found token in localStorage, verifying...");
        } else {
            console.log("No token found, redirecting...");
            dispatch(logout());
            navigate('/login-required', { replace: true });
        }
    }
  }, [location, navigate, dispatch]);

  // Render các route chính
  return <AppRoutes />;
};

const App = () => {
  return <AppContent />;
}

export default App