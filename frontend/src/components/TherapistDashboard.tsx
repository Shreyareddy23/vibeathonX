import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Types/interfaces
interface Session {
  sessionId: string;
  date: Date | string;
  assignedThemes: string[];
  themesChanged: string[];
  emotionsOfChild: string[];
  playedPuzzles: string[];
}

interface Child {
  username: string;
  joinedAt: string;
  sessions?: Session[];
  assignedThemes?: string[];
  currentAssignedThemes?: string[];
}

// Add ThemeTransition type
type ThemeTransition = {
  type: 'start' | 'transition';
  theme?: string;
  from?: string;
  to?: string;
  emotion: string;
  isSameTheme?: boolean;
};

const TherapistDashboard: React.FC = () => {
  const [therapistUsername, setTherapistUsername] = useState('');
  const [therapistCode, setTherapistCode] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [newChildUsername, setNewChildUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [deleteConfirmChild, setDeleteConfirmChild] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();

  // Set background and get therapist data
  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-6.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.minHeight = "100vh";

    const username = sessionStorage.getItem('therapistUsername');
    const code = sessionStorage.getItem('therapistCode');
    if (!username || !code) {
      navigate('/');
      return;
    }
    setTherapistUsername(username);
    setTherapistCode(code);
    fetchTherapistData(username);
  }, [navigate]);

  // Fetch therapist data
  const fetchTherapistData = async (username: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/get-therapist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (response.ok) {
        setChildren(data.children || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch therapist data');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  // Add child
  const handleAddChild = async () => {
    if (!newChildUsername.trim()) {
      setError('Enter a child username');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistCode: therapistCode,
          childName: newChildUsername
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchTherapistData(therapistUsername);
        setNewChildUsername('');
        setError(null);
      } else {
        setError(data.message || 'Failed to add child');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error adding child:', err);
    }
  };

  // Delete child
  const handleDeleteChild = async (childUsername: string) => {
    if (!deleteConfirmChild) {
      setDeleteConfirmChild(childUsername);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('http://localhost:5000/api/delete-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistCode: therapistCode,
          childName: childUsername
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchTherapistData(therapistUsername);
        setDeleteConfirmChild(null);
        setError(null);
        if (selectedChild?.username === childUsername) {
          setSelectedChild(null);
        }
      } else {
        setError(data.message || 'Failed to delete child');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error deleting child:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Prepare emotion data for chart
  const prepareEmotionData = (session: Session) => {
    if (!session.emotionsOfChild || session.emotionsOfChild.length === 0) return [];
    const emotionCounts: {[key: string]: number} = {};
    session.emotionsOfChild.forEach(emotion => {
      const normalizedEmotion = emotion.toLowerCase();
      emotionCounts[normalizedEmotion] = (emotionCounts[normalizedEmotion] || 0) + 1;
    });
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count
    }));
  };

  // Assign themes
  const handleAssignThemes = (childUsername: string) => {
    sessionStorage.setItem('selectedChild', childUsername);
    sessionStorage.setItem('selectedChildTherapistCode', therapistCode);
    navigate('/theme-assignment');
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // Child click
  const handleChildClick = (child: Child) => {
    setSelectedChild(selectedChild?.username === child.username ? null : child);
  };

  // Get emotion color
  const getEmotionColor = (emotion: string | undefined | null): string => {
    if (!emotion) return '#9E9E9E'; // Handle undefined/null
    const emotionColors: { [key: string]: string } = {
      happiness: '#4CAF50',
      sad: '#5C6BC0',
      anger: '#FF0000',
      fear: '#FF9800',
      neutral: '#9E9E9E',
      surprised: '#8E24AA',
      excited: '#FFD600',
      calm: '#03A9F4',
      unknown: '#9E9E9E',
    };
    const normalizedEmotion = emotion.trim().toLowerCase();
    if (emotionColors[normalizedEmotion]) {
      return emotionColors[normalizedEmotion];
    }
    const matchingKey = Object.keys(emotionColors).find(key => 
      normalizedEmotion.includes(key)
    );
    return matchingKey ? emotionColors[matchingKey] : emotionColors.unknown;
  };

  // Process theme transitions for display
  const processThemeTransitions = (session: Session): ThemeTransition[] => {
    if (!session.assignedThemes || session.assignedThemes.length === 0) {
      return [];
    }
    const firstTheme = session.assignedThemes[0];
    const results: ThemeTransition[] = [{
      type: 'start',
      theme: firstTheme,
      emotion: session.emotionsOfChild?.[0] || 'unknown'
    } as ThemeTransition];

    if (session.themesChanged && session.themesChanged.length > 0) {
      let currentTheme = firstTheme;
      for (let i = 0; i < session.themesChanged.length; i++) {
        const nextTheme = session.themesChanged[i];
        const emotion = i + 1 < session.emotionsOfChild.length
          ? session.emotionsOfChild[i + 1]
          : 'unknown';
        results.push({
          type: 'transition',
          from: currentTheme,
          to: nextTheme,
          emotion: emotion,
          isSameTheme: currentTheme === nextTheme
        } as ThemeTransition);
        currentTheme = nextTheme;
      }
    }
    return results;
  };

  // Format date for display
  const formatSessionDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Toggle session expand/collapse
  const toggleSession = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  // Filter children by search query
  const filteredChildren = children.filter((child) =>
    child.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordChangeMessage('Please fill in all fields');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: therapistUsername,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordChangeMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordChangeMessage(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordChangeMessage('Server error');
    }
  };

  if (loading) return <LoadingContainer>Loading...</LoadingContainer>;
  if (error) return <ErrorContainer>Error: {error}</ErrorContainer>;

  return (
    <Container>
      <Header>
        <Title>THERAPIST DASHBOARD</Title>
        <HeaderActions>
          <ChangePasswordButton onClick={() => setShowChangePassword(true)}>
            Change Password
          </ChangePasswordButton>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </HeaderActions>
      </Header>

      {/* Change Password Popup Modal */}
      {showChangePassword && (
        <ChangePasswordModalOverlay>
          <ChangePasswordModal>
            <ModalCloseButton onClick={() => setShowChangePassword(false)}>×</ModalCloseButton>
            <SectionHeader>
              <h2>Change Password</h2>
            </SectionHeader>
            <InputGroup>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
              />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
              />
              <Button onClick={handleChangePassword}>Change Password</Button>
            </InputGroup>
            {passwordChangeMessage && <ErrorMessage>{passwordChangeMessage}</ErrorMessage>}
          </ChangePasswordModal>
        </ChangePasswordModalOverlay>
      )}

      <InfoSection>
        <InfoCard>
          <h3>Your Therapist Code</h3>
          <CodeDisplay>{therapistCode}</CodeDisplay>
          <small>Share this code with your children to let them join</small>
        </InfoCard>
      </InfoSection>

      <Section>
        <SectionHeader>
          <h2>Your Children</h2>
          <SearchInput
            type="text"
            placeholder="Search for a child..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SectionHeader>

        <AddChildSection>
          <InputGroup>
            <Input
              type="text"
              value={newChildUsername}
              onChange={(e) => setNewChildUsername(e.target.value)}
              placeholder="Enter child username"
            />
            <Button onClick={handleAddChild}>Add Child</Button>
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </AddChildSection>

        {filteredChildren.length === 0 ? (
          <EmptyState>No children found</EmptyState>
        ) : (
          <ChildrenGrid>
            {filteredChildren.map((child) => (
              <React.Fragment key={child.username}>
                <ChildCard 
                  onClick={() => handleChildClick(child)} 
                  isSelected={selectedChild?.username === child.username}
                >
                  <ChildCardHeader>
                    <h3>{child.username}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SessionsCount>{child.sessions?.length || 0} Sessions</SessionsCount>
                      <DeleteButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChild(child.username);
                        }}
                        title="Delete child"
                        aria-label="Delete child"
                      >
                        ×
                      </DeleteButton>
                    </div>
                  </ChildCardHeader>
                  <ChildCardContent>
                    <p>Joined: {new Date(child.joinedAt).toLocaleDateString()}</p>
                    <ThemesWrapper>
                      <p>Assigned Themes: </p>
                      <ThemesList>
                        {(child.currentAssignedThemes?.length || child.assignedThemes?.length) ? 
                          (child.currentAssignedThemes || child.assignedThemes)?.map((theme, idx) => (
                            <ThemeTag key={idx}>{theme}</ThemeTag>
                          ))
                          : <ThemeTag empty>None</ThemeTag>
                        }
                      </ThemesList>
                    </ThemesWrapper>
                  </ChildCardContent>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignThemes(child.username);
                    }}
                  >
                    Assign Themes
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/all-sessions-emotions', {
                        state: {
                          allSessions: child.sessions || [],
                        },
                      });
                    }}
                    style={{ marginTop: '10px' }}
                  >
                    View All Sessions Emotions
                  </ActionButton>
                </ChildCard>
  
                {selectedChild?.username === child.username && (
                  <SessionsContainer>
                    <SessionsContainerHeader>
                      <h4>Sessions History</h4>
                      <SessionsCount>Total: {child.sessions?.length || 0}</SessionsCount>
                    </SessionsContainerHeader>
                    
                    {!child.sessions || child.sessions.length === 0 ? (
                      <EmptySessionsState>
                        <NoSessionsIcon>📊</NoSessionsIcon>
                        <p>No sessions recorded yet</p>
                      </EmptySessionsState>
                    ) : (
                      <SessionsList>
                        {child.sessions.map((session: Session) => {
                          const isExpanded = expandedSessionId === session.sessionId;
                          const themeTransitions = processThemeTransitions(session);
                          return (
                            <SessionCard key={session.sessionId}>
                              <SessionHeader>
                                <SessionDate>
                                  <CalendarIcon>📅</CalendarIcon>
                                  {formatSessionDate(session.date)}
                                </SessionDate>
                                <SessionStats>
                                  <StatBadge>
                                    <StatIcon>🧩</StatIcon>
                                    {session.playedPuzzles?.length || 0} Puzzles
                                  </StatBadge>
                                  <StatBadge>
                                    <StatIcon>🎭</StatIcon>
                                    {themeTransitions.length} Transitions
                                  </StatBadge>
                                </SessionStats>
                                <ToggleArrow onClick={() => toggleSession(session.sessionId)}>
                                  {isExpanded ? '▲' : '▼'}
                                </ToggleArrow>
                              </SessionHeader>
                              
                              {isExpanded && (
                                <SessionBody>
                                  <SessionSection>
                                    <SectionTitle>Themes</SectionTitle>
                                    <ThemeWrapper>
                                      {session.assignedThemes?.map((theme, idx) => (
                                        <ThemeTag key={idx}>{theme}</ThemeTag>
                                      )) || <p>None</p>}
                                    </ThemeWrapper>
                                  </SessionSection>
  
                                  {themeTransitions.length > 0 && (
                                    <SessionSection>
                                      <SectionTitle>Theme Journey</SectionTitle>
                                      <ThemeJourneyTimeline>
                                        {themeTransitions.map((transition, index) => {
                                          const emotionColor = getEmotionColor(transition.emotion);
                                          if (transition.type === 'start') {
                                            return (
                                              <TimelineItem key={`start-${index}`} isFirst={true}>
                                                <TimelineConnector isFirst={true} />
                                                <TimelineBubble color={emotionColor}>
                                                  <EmotionIndicator color={emotionColor} />
                                                </TimelineBubble>
                                                <TimelineContent>
                                                  <TimelineTitle>Started with: {transition.theme}</TimelineTitle>
                                                  <TimelineDetail>Emotion: {transition.emotion}</TimelineDetail>
                                                </TimelineContent>
                                              </TimelineItem>
                                            );
                                          } else {
                                            return (
                                              <TimelineItem key={`transition-${index}`}>
                                                <TimelineConnector />
                                                <TimelineBubble color={emotionColor}>
                                                  <EmotionIndicator color={emotionColor} />
                                                </TimelineBubble>
                                                <TimelineContent>
                                                  <TimelineTitle>
                                                    {transition.from}{' '}
                                                    {transition.isSameTheme ? 
                                                      <StayedIndicator>(stayed)</StayedIndicator> : 
                                                      <TransitionArrow>→</TransitionArrow>
                                                    }{' '}
                                                    {!transition.isSameTheme && transition.to}
                                                  </TimelineTitle>
                                                  <TimelineDetail>Emotion: {transition.emotion}</TimelineDetail>
                                                </TimelineContent>
                                              </TimelineItem>
                                            );
                                          }
                                        })}
                                      </ThemeJourneyTimeline>
                                    </SessionSection>
                                  )}

                                  <SessionSection>
                                    <SectionTitle>Emotion Summary</SectionTitle>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '16px',
                                      justifyContent: 'center',
                                    }}>
                                      <div style={{ width: '60%', maxWidth: '300px' }}>
                                        <ResponsiveContainer width="100%" height={300}>
                                          <PieChart>
                                            <Pie
                                              data={prepareEmotionData(session)}
                                              cx="50%"
                                              cy="50%"
                                              labelLine={false}
                                              outerRadius={80}
                                              fill="#8884d8"
                                              dataKey="count"
                                              nameKey="emotion"
                                              label={false}
                                            >
                                              {prepareEmotionData(session).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
                                              ))}
                                            </Pie>
                                            <Tooltip 
                                              formatter={(value: number, name: string) => [
                                                value, 
                                                `${name}: ${((value / session.emotionsOfChild.length) * 100).toFixed(1)}%`
                                              ]}
                                            />
                                          </PieChart>
                                        </ResponsiveContainer>
                                      </div>
                                      <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        paddingLeft: '16px',
                                      }}>
                                        {prepareEmotionData(session).map((entry, index) => (
                                          <div key={`legend-${index}`} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            fontSize: '14px',
                                          }}>
                                            <div style={{
                                              width: '12px',
                                              height: '12px',
                                              backgroundColor: getEmotionColor(entry.emotion),
                                              marginRight: '8px',
                                              borderRadius: '2px',
                                            }} />
                                            <span>
                                              {entry.emotion}: <strong>{((entry.count / session.emotionsOfChild.length) * 100).toFixed(0)}%</strong>
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </SessionSection>
  
                                  {session.playedPuzzles && session.playedPuzzles.length > 0 && (
                                    <SessionSection>
                                      <SectionTitle>Puzzles Played</SectionTitle>
                                      <div>{session.playedPuzzles.length || 0}</div>
                                    </SessionSection>
                                  )}
                                </SessionBody>
                              )}
                            </SessionCard>
                          );
                        })}
                      </SessionsList>
                    )}
                  </SessionsContainer>
                )}
              </React.Fragment>
            ))}
          </ChildrenGrid>
        )}
      </Section>

      {deleteConfirmChild && (
        <ConfirmationOverlay>
          <ConfirmationModal>
            <ConfirmationHeader>
              <WarningIcon>⚠️</WarningIcon>
              <h3>Confirm Deletion</h3>
            </ConfirmationHeader>
            <ConfirmationContent>
              <p>Are you sure you want to delete <strong>{deleteConfirmChild}</strong>?</p>
              <p>This action will permanently remove the child and all their session data.</p>
            </ConfirmationContent>
            <ConfirmationActions>
              <CancelButton 
                onClick={() => setDeleteConfirmChild(null)}
                disabled={isDeleting}
              >
                Cancel
              </CancelButton>
              <ConfirmDeleteButton 
                onClick={() => handleDeleteChild(deleteConfirmChild)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </ConfirmDeleteButton>
            </ConfirmationActions>
          </ConfirmationModal>
        </ConfirmationOverlay>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px; 
  max-width: 1200px; 
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333; 
  margin: 0;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

const LogoutButton = styled.button`
  padding: 8px 16px; 
  background-color: #ff4444; 
  color: white;
  border: none; 
  border-radius: 4px; 
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { 
    background-color: #cc0000; 
    transform: translateY(-2px);
  }
`;

const InfoSection = styled.div`
  margin-bottom: 30px;
`;

const InfoCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px; 
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
`;

const CodeDisplay = styled.div`
  font-size: 28px; 
  font-weight: bold; 
  color: #5a7af0; 
  margin: 15px 0;
  letter-spacing: 1px;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 20px;
  h2 {
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
`;

const AddChildSection = styled.div`
  margin-bottom: 25px;
`;

const InputGroup = styled.div`
  display: flex; 
  gap: 10px; 
  margin-bottom: 10px;
`;

const Input = styled.input`
  padding: 12px 15px; 
  border: 1px solid #ddd; 
  border-radius: 8px; 
  flex: 1;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #5a7af0;
    box-shadow: 0 0 0 2px rgba(90, 122, 240, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px 20px; 
  background-color: #5a7af0;
  color: white; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover { 
    background-color: #4a67cc; 
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(90, 122, 240, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c; 
  background: #fdeaea; 
  padding: 0.8rem;
  border-radius: 8px; 
  text-align: center;
  border-left: 4px solid #e74c3c;
`;

const EmptyState = styled.div`
  text-align: center; 
  padding: 40px; 
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px; 
  color: #666;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const ChildrenGrid = styled.div`
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
`;

const ChildCard = styled.div<{ isSelected?: boolean }>`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 20px; 
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: ${props => props.isSelected ? '5px solid #5a7af0' : '5px solid transparent'};
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }
  
  &:after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: ${props => props.isSelected ? '#5a7af0' : 'transparent'};
    transition: all 0.3s ease;
    clip-path: polygon(0 0, 100% 0, 100% 100%);
    opacity: 0.1;
  }
`;

const ChildCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 700;
    font-size: 18px;
  }
`;

const SessionsCount = styled.span`
  background-color: #e8f4fd;
  color: #5a7af0;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const DeleteButton = styled.button`
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: white;
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: linear-gradient(135deg, #ff5252, #d32f2f);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(238, 90, 82, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ChildCardContent = styled.div`
  margin-bottom: 15px;
  
  p {
    margin: 8px 0;
    color: #666;
    font-size: 14px;
  }
`;

const ThemesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  p {
    margin: 0;
    font-weight: 600;
    color: #555;
  }
`;

const ThemesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ThemeTag = styled.span<{ empty?: boolean }>`
  background-color: ${props => props.empty ? '#f8f9fa' : '#e8f4fd'};
  color: ${props => props.empty ? '#999' : '#5a7af0'};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: ${props => props.empty ? '1px dashed #ccc' : 'none'};
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #5a7af0;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #4a67cc;
    transform: translateY(-1px);
  }
`;

const SessionsContainer = styled.div`
  grid-column: 1 / -1;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 25px;
  margin-top: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
`;

const SessionsContainerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
  
  h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 700;
    font-size: 20px;
  }
`;

const EmptySessionsState = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  
  p {
    margin: 10px 0 0 0;
    font-size: 16px;
  }
`;

const NoSessionsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SessionCard = styled.div`
  background-color: #fafbfc;
  border-radius: 10px;
  padding: 20px;
  border-left: 4px solid #5a7af0;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f5f7fa;
    transform: translateX(2px);
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const SessionDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
`;

const CalendarIcon = styled.span`
  font-size: 16px;
`;

const SessionStats = styled.div`
  display: flex;
  gap: 12px;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #e8f4fd;
  color: #5a7af0;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const StatIcon = styled.span`
  font-size: 14px;
`;

const ToggleArrow = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #5a7af0;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e8f4fd;
  }
`;

const SessionBody = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
`;

const SessionSection = styled.div`
  margin-bottom: 25px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h5`
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ThemeWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ThemeJourneyTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TimelineItem = styled.div<{ isFirst?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
`;

const TimelineConnector = styled.div<{ isFirst?: boolean }>`
  width: 2px;
  height: 40px;
  background-color: ${props => props.isFirst ? 'transparent' : '#ddd'};
  position: absolute;
  left: 11px;
  top: -40px;
`;

const TimelineBubble = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EmotionIndicator = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: white;
  opacity: 0.9;
`;

const TimelineContent = styled.div`
  flex: 1;
  padding-top: 2px;
`;

const TimelineTitle = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const TimelineDetail = styled.div`
  font-size: 12px;
  color: #666;
`;

const StayedIndicator = styled.span`
  color: #666;
  font-style: italic;
  font-size: 14px;
`;

const TransitionArrow = styled.span`
  color: #5a7af0;
  font-weight: bold;
  margin: 0 4px;
`;

const SearchInput = styled.input`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 250px;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #5a7af0;
    box-shadow: 0 0 0 2px rgba(90, 122, 240, 0.2);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #e74c3c;
  background-color: #fdeaea;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
`;

const ConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ConfirmationModal = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-50px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ConfirmationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 700;
  }
`;

const WarningIcon = styled.span`
  font-size: 24px;
`;

const ConfirmationContent = styled.div`
  margin-bottom: 25px;
  
  p {
    margin: 10px 0;
    color: #555;
    line-height: 1.5;
    
    &:first-child {
      font-weight: 600;
    }
  }
`;

const ConfirmationActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmDeleteButton = styled.button`
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #c0392b;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ChangePasswordButton = styled.button`
  background: #5a7af0;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0;
  margin-right: 0;
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: #4a67cc;
    transform: translateY(-2px);
  }
`;

// Popup modal overlay for change password
const ChangePasswordModalOverlay = styled.div`
  position: fixed;
  z-index: 3000;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChangePasswordModal = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 40px rgba(90, 122, 240, 0.18);
  padding: 36px 28px 28px 28px;
  min-width: 340px;
  max-width: 95vw;
  min-height: 220px;
  position: relative;
  animation: fadeInScale 0.25s;

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(30px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
  &:hover {
    color: #e74c3c;
  }
`;

export default TherapistDashboard;