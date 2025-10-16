import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SuperAdminDashboard: React.FC = () => {
  const [therapists, setTherapists] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'register' | 'therapists'>('register');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [therapistToDelete, setTherapistToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/superadmin/therapists');
      const data = await response.json();
      response.ok ? setTherapists(data) : setError(data.message || 'Failed to fetch therapists');
    } catch {
      setError('Failed to connect to the server');
    }
  };

  const handleRegisterTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/superadmin/register-therapist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Therapist registered successfully!');
        setUsername('');
        setPassword('');
        fetchTherapists();
      } else {
        setError(data.message || 'Failed to register therapist');
      }
    } catch {
      setError('Failed to connect to the server');
    }
  };

  const confirmDeleteTherapist = (id: string) => {
    setTherapistToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteTherapist = async () => {
    if (!therapistToDelete) return;
    setError('');
    setSuccess('');
    setShowDeleteConfirmation(false);

    console.log('Deleting therapist with ID:', therapistToDelete); // Debugging log

    try {
      const response = await fetch(`http://localhost:5000/api/superadmin/delete-therapist/${therapistToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('Delete response:', data); // Debugging log

      if (response.ok) {
        setSuccess('Therapist deleted successfully!');
        fetchTherapists(); // Refresh the therapist list
      } else {
        setError(data.message || 'Failed to delete therapist');
      }
    } catch (err) {
      console.error('Error deleting therapist:', err); // Debugging log
      setError('Failed to connect to the server');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminToken');
    window.location.href = '/superadmin/login';
  };

  return (
    <DashboardContainer>
      <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      <Sidebar>
        <SidebarHeader>
          <h2>Dashboard</h2>
        </SidebarHeader>
        <SidebarMenu>
          <SidebarItem
            active={activeSection === 'register'}
            onClick={() => setActiveSection('register')}
          >
            Register Therapist
          </SidebarItem>
          <SidebarItem
            active={activeSection === 'therapists'}
            onClick={() => setActiveSection('therapists')}
          >
            Therapists
          </SidebarItem>
        </SidebarMenu>
      </Sidebar>

      <MainContent>
        {activeSection === 'register' && (
          <Card>
            <h2>Register New Therapist</h2>
            {success && <Success>{success}</Success>}
            {error && <Error>{error}</Error>}
            <form onSubmit={handleRegisterTherapist}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit">Register</button>
            </form>
          </Card>
        )}

        {activeSection === 'therapists' && (
          <Card>
            <h2>Therapist List</h2>
            {therapists.length === 0 ? (
              <Empty>No therapists found</Empty>
            ) : (
              <TherapistList>
                {therapists.map((t: any) => (
                  <TherapistItem key={t._id}>
                    <div>
                      <strong>{t.username}</strong>
                      <small>Code: {t.code}</small>
                    </div>
                    <button onClick={() => confirmDeleteTherapist(t._id)}>Delete</button>
                  </TherapistItem>
                ))}
              </TherapistList>
            )}
          </Card>
        )}
      </MainContent>

      {showDeleteConfirmation && (
        <>
          <Overlay onClick={() => setShowDeleteConfirmation(false)} />
          <ConfirmationModal>
            <p>Are you sure you want to delete this therapist?</p>
            <button onClick={handleDeleteTherapist}>Yes, Delete</button>
            <button onClick={() => setShowDeleteConfirmation(false)}>Cancel</button>
          </ConfirmationModal>
        </>
      )}
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f4f6f9;
`;

const LogoutButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #d9363e;
  }
`;

const Sidebar = styled.div`
  width: 250px;
  background: #5a7af0;
  color: white;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 20px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  background: #4a67cc;
`;

const SidebarMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SidebarItem = styled.li<{ active?: boolean }>`
  padding: 15px 20px;
  cursor: pointer;
  background: ${(props) => (props.active ? '#4a67cc' : 'transparent')};
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};

  &:hover {
    background: #4a67cc;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex; /* Use flexbox for centering */
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  padding: 40px;
`;

const Card = styled.div`
  width: 100%; /* Allow the card to take full width within its max-width */
  max-width: 600px; /* Limit the card's width */
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  h2 {
    margin-bottom: 20px;
    font-size: 1.5rem;
    color: #333;
  }

  form {
    display: flex;
    flex-direction: column;

    label {
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    input {
      margin-bottom: 16px;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #ccc;
    }

    button {
      padding: 12px;
      background: #5a7af0;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;

      &:hover {
        background: #4a67cc;
      }
    }
  }
`;

const TherapistList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const TherapistItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;

  strong {
    font-size: 1.1rem;
  }

  small {
    color: #666;
  }

  button {
    padding: 8px 12px;
    background: #ff4d4f;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;

    &:hover {
      background: #d9363e;
    }
  }
`;

const Success = styled.p`
  color: green;
  margin-bottom: 10px;
`;

const Error = styled.p`
  color: red;
  margin-bottom: 10px;
`;

const Empty = styled.div`
  text-align: center;
  color: #888;
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  width: 400px;
  text-align: center;

  p {
    font-size: 1.2rem;
    margin-bottom: 20px;
    color: #333;
  }

  button {
    padding: 10px 20px;
    margin: 0 10px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    font-weight: bold;
  }

  button:first-of-type {
    background: #ff4d4f;
    color: white;

    &:hover {
      background: #d9363e;
    }
  }

  button:last-of-type {
    background: #ccc;
    color: #333;

    &:hover {
      background: #bbb;
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
`;

export default SuperAdminDashboard;

