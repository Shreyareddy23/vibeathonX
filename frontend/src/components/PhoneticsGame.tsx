import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const DEFAULT_SET = [
  { label: 'a', example: 'apple' },
  { label: 'e', example: 'elephant' },
  { label: 'i', example: 'igloo' },
  { label: 'o', example: 'octopus' },
  { label: 'u', example: 'umbrella' },
  { label: 'sh', example: 'ship' },
  { label: 'ch', example: 'chair' },
  { label: 'th', example: 'thumb' },
  { label: 'ph', example: 'phone' },
  { label: 'bl', example: 'blue' },
  { label: 'cl', example: 'clock' },
  { label: 'dr', example: 'drum' },
  { label: 'tr', example: 'train' },
  { label: 'br', example: 'bread' },
  { label: 'st', example: 'star' }
];

const TOTAL_ITEMS = 12;

const PhoneticsGame: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(DEFAULT_SET);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const childData = sessionStorage.getItem('childData');
    if (!childData) {
      navigate('/child-login');
      return;
    }
  }, [navigate]);

  const sequence = useMemo(() => {
    // Shuffle and take a fixed-length sequence
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(TOTAL_ITEMS, shuffled.length));
  }, [items]);

  const play = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const current = sequence[index] || sequence[sequence.length - 1];

  const onNext = () => setIndex(prev => Math.min(prev + 1, sequence.length - 1));
  const onPrev = () => setIndex(prev => Math.max(prev - 1, 0));

  return (
    <Container>
      <Card>
        <TopBar>
          <BackButton onClick={() => navigate('/')}>×</BackButton>
          <Title>🔊 Phonetics Practice</Title>
        </TopBar>

        <NowPracticing>
          <Phonetic>{current?.label}</Phonetic>
          <Example>Example: {current?.example}</Example>
          <Row>
            <PlayButton onClick={() => play(current?.label || '')}>Play sound</PlayButton>
            <PlayButton secondary onClick={() => play(current?.example || '')}>Play example</PlayButton>
          </Row>
        </NowPracticing>

        <Grid>
          {sequence.map((it, i) => (
            <Item key={`${it.label}-${i}`} active={i === index} onClick={() => setIndex(i)}>
              <span className="label">{it.label}</span>
              <button className="mini" onClick={(e) => { e.stopPropagation(); play(it.label); }}>▶</button>
            </Item>
          ))}
        </Grid>

        <Controls>
          <NavButton disabled={index === 0} onClick={onPrev}>Previous</NavButton>
          <Progress>{index + 1} / {sequence.length}</Progress>
          <NavButton disabled={index === sequence.length - 1} onClick={onNext}>Next</NavButton>
        </Controls>
      </Card>
    </Container>
  );
};

const Container = styled.div`
  display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: linear-gradient(135deg, #f0f4ff, #fafcff);
`;
const Card = styled.div`
  width: 100%; max-width: 900px; background: white; border-radius: 16px; padding: 20px; box-shadow: 0 16px 40px rgba(0,0,0,0.08); position: relative;
`;
const TopBar = styled.div`
  display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
`;
const BackButton = styled.button`
  position: absolute; right: 16px; top: 12px; width: 40px; height: 40px; border-radius: 10px; border: none; background: #ff6b6b; color: white; font-size: 22px; cursor: pointer;
`;
const Title = styled.h2`
  margin: 0; color: #333; font-weight: 800;
`;
const NowPracticing = styled.div`
  text-align: center; padding: 20px 10px; border: 1px solid #eef2f7; border-radius: 12px; background: #fbfdff; margin-bottom: 16px;
`;
const Phonetic = styled.div`
  font-size: 54px; font-weight: 900; color: #3348c8; letter-spacing: 2px;
`;
const Example = styled.div`
  margin-top: 8px; color: #666;
`;
const Row = styled.div`
  margin-top: 14px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
`;
const PlayButton = styled.button<{secondary?: boolean}>`
  padding: 10px 16px; border: none; border-radius: 10px; cursor: pointer; font-weight: 800; color: white; background: ${p=>p.secondary?'#6b7280':'#3348c8'};
` as any;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; margin-top: 16px;
`;
const Item = styled.div<{active?: boolean}>`
  border: 1px solid ${p=>p.active?'#3348c8':'#eef2f7'}; background: ${p=>p.active?'#eef3ff':'#fff'}; border-radius: 12px; padding: 14px 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;
  .label { font-weight: 900; color: #2c3e50; font-size: 18px; }
  .mini { border: none; background: #e8eefc; color: #3348c8; border-radius: 999px; width: 28px; height: 28px; cursor: pointer; }
` as any;
const Controls = styled.div`
  margin-top: 14px; display: flex; align-items: center; justify-content: space-between;
`;
const NavButton = styled.button`
  padding: 10px 14px; border: none; border-radius: 10px; background: #3348c8; color: white; font-weight: 800; opacity: 1; cursor: pointer; disabled:opacity:0.5;
`;
const Progress = styled.div`
  color: #666; font-weight: 700;
`;

export default PhoneticsGame;


