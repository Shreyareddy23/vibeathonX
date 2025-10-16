// AllSessionsEmotionView.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import styled from 'styled-components';
export const AllSessionsEmotionView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { allSessions } = location.state || { allSessions: [] };

  // Aggregate emotion data from all sessions
  const prepareAllEmotionData = () => {
    const emotionCounts: Record<string, number> = {};

    allSessions.forEach((session: Session) => {
      session.emotionsOfChild?.forEach(emotion => {
        const normalizedEmotion = emotion.toLowerCase().trim();
        emotionCounts[normalizedEmotion] = (emotionCounts[normalizedEmotion] || 0) + 1;
      });
    });

    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count
    }));
  };

  const emotionData = prepareAllEmotionData();
  const totalEmotions = emotionData.reduce((sum, entry) => sum + entry.count, 0);

  const getEmotionColor = (emotion: string | undefined | null): string => {
    // Use the same color mapping as in your dashboard
    const emotionColors: Record<string, string> = {
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

    if (!emotion) return emotionColors.unknown;
    const normalizedEmotion = emotion.trim().toLowerCase();
    return emotionColors[normalizedEmotion] || emotionColors.unknown;
  };

  return (
    <Container>
      <Header>
        <Title>ALL SESSIONS EMOTION SUMMARY</Title>
        <BackButton onClick={() => navigate(-1)}>Back to Dashboard</BackButton>
      </Header>

      <ChartSection>
        {emotionData.length > 0 ? (
          <>
            <SectionTitle>Emotion Distribution Across All Sessions</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '60%', maxWidth: '400px' }}>
              <ResponsiveContainer width="100%" height={400}>
  <PieChart>
    <Pie
      data={emotionData}
      cx="50%"
      cy="50%"
      outerRadius={120}
      fill="#8884d8"
      dataKey="count"
      nameKey="emotion"
      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
    >
      {emotionData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
      ))}
    </Pie>
    <Tooltip 
      formatter={(value: number, name: string) => [
        value, // Shows raw count (e.g., "5")
        `${name}`// Shows "anger: 60.0%"
      ]}
    />
  </PieChart>
</ResponsiveContainer>
                {/* <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={emotionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="emotion"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {emotionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value, 
                        `${name}: ${((value / totalEmotions) * 100).toFixed(1)}%`
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer> */}
              </div>
              <div style={{ flex: 1 }}>
                <h3>Total Sessions: {allSessions.length}</h3>
                <h3>Total Emotions Recorded: {totalEmotions}</h3>
                <div style={{ marginTop: '20px' }}>
                  {emotionData.map((entry, index) => (
                    <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getEmotionColor(entry.emotion),
                        marginRight: '8px',
                        borderRadius: '2px',
                      }} />
                      <span>
                        {entry.emotion}: <strong>{entry.count} ({((entry.count / totalEmotions) * 100).toFixed(1)}%)</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState>No emotion data available across sessions</EmptyState>
        )}
      </ChartSection>
    </Container>
  );
};

// Add these styled components (or adjust based on your existing styles)
const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: white;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ChartSection = styled.div`
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  margin-bottom: 20px;
  color: #333;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;
export default AllSessionsEmotionView;