import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Both username and password are required');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (response.ok) {
          if (data.role === 'therapist') {
            // Therapist login
            sessionStorage.setItem('therapistUsername', data.username);
            sessionStorage.setItem('therapistCode', data.code);
            navigate('/dashboard');
          } else if (data.role === 'child') {
            // Child login
            sessionStorage.setItem('childData', JSON.stringify({
              username: data.username,
              therapistCode: data.therapistCode,
              assignedThemes: data.assignedThemes || [],
              sessionId: data.sessionId,
            }));
            navigate('/landing');
          }
        } else {
          setError(data.message || 'Invalid username or password');
        }
      } else {
        setError('Server error. Please try again later.');
        console.error('Server returned non-JSON response');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Login error:', err);
    }
  };

  return (
    <Container>
      <FormWrapper>
        <FormCard>
          <Title>
            Welcome to Joyverse! <SparkleIcon>✨</SparkleIcon>
          </Title>
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label>Username</Label>
              <StyledInput
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </InputGroup>
            <InputGroup>
              <Label>Password</Label>
              <StyledInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </InputGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <ActionButton type="submit">
              Login <RocketIcon>🚀</RocketIcon>
            </ActionButton>
          </Form>
        </FormCard>
      </FormWrapper>
    </Container>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Full screen background with better positioning
const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('/images/bg-5.jpg') no-repeat center center fixed;
  background-size: cover;
  padding: 1rem;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(114,198,255,0.2) 100%);
  }
`;

// Added a wrapper to create better visual hierarchy
const FormWrapper = styled.div`
  width: 100%;
  max-width: 460px;
  padding: 20px;
  position: relative;
  z-index: 2;
`;

// Improved card with better styling and rounded corners
const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 25px;
  box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
  animation: ${fadeIn} 0.6s ease-out;
  border: 8px solid white;
`;

// More playful title with better typography
const Title = styled.h1`
  text-align: center;
  color: #4A6AD0;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1.3;
`;

const SparkleIcon = styled.span`
  display: inline-block;
  margin-left: 8px;
  animation: ${float} 2s ease-in-out infinite;
  font-size: 1.2em;
`;

const RocketIcon = styled.span`
  display: inline-block;
  margin-left: 5px;
  animation: ${float} 3s ease-in-out infinite;
  font-size: 1.2em;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

// More consistent label styling
const Label = styled.label`
  color: #555;
  font-size: 1.1rem;
  font-weight: 600;
  margin-left: 5px;
`;

// Improved input styling with consistent rounding and focus states
const StyledInput = styled.input`
  padding: 1.1rem;
  border: 2px solid #c3d5ff;
  border-radius: 15px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.9);

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 4px rgba(110, 142, 251, 0.15);
    background-color: white;
  }

  &::placeholder {
    color: #aaa;
  }
`;

// More prominent and playful button
const ActionButton = styled.button`
  padding: 1.2rem;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 0.5rem;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 15px rgba(110, 142, 251, 0.3);
  animation: ${pulse} 4s infinite ease-in-out;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(110, 142, 251, 0.4);
    background: linear-gradient(135deg, #5a7af0 0%, #9566d2 100%);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  text-align: center;
  font-size: 0.95rem;
  padding: 0.7rem;
  border-radius: 12px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
`;

export default Login;