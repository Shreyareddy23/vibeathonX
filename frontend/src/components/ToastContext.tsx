import React, { createContext, useCallback, useContext, useState } from 'react';
import styled, { keyframes } from 'styled-components';

type ToastContextType = {
  showToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && <ToastContainer role="status">{message}</ToastContainer>}
    </ToastContext.Provider>
  );
};

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.85);
  color: white;
  padding: 12px 18px;
  border-radius: 12px;
  z-index: 9999;
  animation: ${floatIn} 180ms ease-out;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
`;

export default ToastContext;
