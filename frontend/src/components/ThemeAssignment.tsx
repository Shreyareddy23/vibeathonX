import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const AVAILABLE_THEMES = [
  { id: 'forest', name: 'Forest', description: 'Adventure in the woods' },
  { id: 'underwater', name: 'Underwater', description: 'Explore the ocean depths' },
  { id: 'space', name: 'Space', description: 'Journey through the cosmos' },
  { id: 'kitchen', name: 'Kitchen', description: 'Cook and learn in the kitchen' },
  { id: 'playground', name: 'Playground', description: 'Fun at the playground' }
];

const ThemeAssignment: React.FC = () => {
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [childUsername, setChildUsername] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const selectedChild = sessionStorage.getItem('selectedChild');
    const therapistCode = sessionStorage.getItem('selectedChildTherapistCode');
    
    if (!selectedChild || !therapistCode) {
      navigate('/dashboard');
      return;
    }

    setChildUsername(selectedChild);
    
    // First test if server is running
    fetch('http://localhost:5000/api/test')
      .then(response => response.json())
      .then(() => {
        // Server is running, now fetch themes
        return fetch(`http://localhost:5000/api/get-child-themes?username=${selectedChild}&therapistCode=${therapistCode}`);
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Failed to fetch themes');
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.themes) {
          setSelectedThemes(data.themes);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setError(error.message || 'Failed to connect to server. Please make sure the server is running.');
      });
  }, [navigate]);

  const handleThemeToggle = (themeId: string) => {
    setSelectedThemes(prev => {
      if (prev.includes(themeId)) {
        return prev.filter(id => id !== themeId);
      } else {
        if (prev.length >= 3) {
          setError('You can only select up to 3 themes');
          return prev;
        }
        return [...prev, themeId];
      }
    });
    setError(null);
  };

  const handleSaveThemes = async () => {
    const selectedChild = sessionStorage.getItem('selectedChild');
    const therapistCode = sessionStorage.getItem('selectedChildTherapistCode');

    if (!selectedChild || !therapistCode) {
      setError('Child or therapist information missing');
      return;
    }

    if (selectedThemes.length === 0) {
      setError('Please select at least one theme');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/update-child-themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: selectedChild,
          therapistCode: therapistCode,
          themes: selectedThemes
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save themes');
      }

      if (data.success) {
        setSuccess('Themes assigned successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Failed to assign themes');
      }
    } catch (error: any) {
      console.error('Error saving themes:', error);
      setError(error?.message || 'Failed to connect to server. Please make sure the server is running.');
    }
  };

  return (
    <Container>
      <Header>
        <Title>Assign Themes to {childUsername}</Title>
        <BackButton onClick={() => navigate('/dashboard')}>Back to Dashboard</BackButton>
      </Header>

      <Description>
        Select up to 3 themes for {childUsername} to play with.
      </Description>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ThemesGrid>
        {AVAILABLE_THEMES.map(theme => (
          <ThemeCard 
            key={theme.id}
            selected={selectedThemes.includes(theme.id)}
            onClick={() => handleThemeToggle(theme.id)}
          >
            <ThemeTitle>{theme.name}</ThemeTitle>
            <ThemeDescription>{theme.description}</ThemeDescription>
            <SelectionIndicator>
              {selectedThemes.includes(theme.id) ? '✓ Selected' : 'Click to select'}
            </SelectionIndicator>
          </ThemeCard>
        ))}
      </ThemesGrid>

      <ButtonGroup>
        <SaveButton onClick={handleSaveThemes} disabled={selectedThemes.length === 0}>
          Save Theme Assignment
        </SaveButton>
      </ButtonGroup>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #5a6268;
  }
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 20px;
`;

const ThemesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ThemeCard = styled.div<{ selected: boolean }>`
  background-color: ${props => props.selected ? '#e3f2fd' : 'white'};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.selected ? '#2196f3' : 'transparent'};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const ThemeTitle = styled.h3`
  color: #333;
  margin: 0 0 10px 0;
`;

const ThemeDescription = styled.p`
  color: #666;
  margin: 0 0 15px 0;
`;

const SelectionIndicator = styled.div`
  color: #2196f3;
  font-weight: 500;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: #fdeaea;
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  color: #2ecc71;
  background: #eafaf1;
  padding: 0.8rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
`;

export default ThemeAssignment; 