import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

type SuperAdminLoginProps = {
  setIsAuthenticated: (value: boolean) => void;
};

const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response:', response);

      const data = await response.json();
      if (response.ok) {
        setIsAuthenticated(true); // Update authentication state
        navigate('/superadmin/dashboard'); // Redirect to dashboard
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to the server');
    }
  };

  return (
    <Container>
      <Form onSubmit={handleLogin}>
        <Title>Super Admin Login</Title>
        <InputGroup>
          <Label>Username</Label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </InputGroup>
        <InputGroup>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </InputGroup>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit">Login</Button>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f7f9fc;
`;

const Form = styled.form`
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  color: #333;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background: #5a7af0;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background: #4a67cc;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 10px;
`;

export default SuperAdminLogin;