import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // On first load, try to restore the full user object from localStorage
    try {
      const saved = localStorage.getItem('avdiary-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (err) {
      console.error('Failed to parse user from localStorage', err);
    }
    // Fallback – user is not logged in or data is corrupt
    return { name: 'Trader', image: null, subscription_tier: 'free' };
  });

  // Every time the user object changes, save it to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('avdiary-user', JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save user to localStorage', err);
    }
  }, [user]);

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}