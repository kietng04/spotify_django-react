import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem có thông tin đăng nhập trong localStorage không
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsedData = JSON.parse(storedUser);
        setUserData(parsedData);
        
        // Tùy chọn: Xác thực token
        validateToken(parsedData.token);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/validate-token/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (!response.ok) {
        // Token không hợp lệ, đăng xuất người dùng
        logout();
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }
  };

  const login = (data) => {
    setUserData(data);
    localStorage.setItem('userData', JSON.stringify(data));
  };

  const logout = () => {
    setUserData(null);
    localStorage.removeItem('userData');
  };

  const updateUser = (newData) => {
    const updatedData = { ...userData, ...newData };
    setUserData(updatedData);
    localStorage.setItem('userData', JSON.stringify(updatedData));
  };

  return (
    <UserContext.Provider value={{ userData, loading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};