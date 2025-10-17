import React, { useState, useEffect } from 'react';
import {styled,  keyframes, createGlobalStyle } from 'styled-components';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    // Initialize animation for stars
    const stars = document.querySelectorAll('.animated-star');
    stars.forEach(star => {
      animateStar(star as HTMLElement);
    });
  }, []);

  // Function to animate stars with random movement
  const animateStar = (element: HTMLElement) => {
    const randomX = Math.random() * 20 - 10;
    const randomY = Math.random() * 20 - 10;
    const randomDuration = 3 + Math.random() * 4;
    const randomDelay = Math.random() * 2;

    element.style.animation = `floatStar ${randomDuration}s ease-in-out ${randomDelay}s infinite alternate`;
    element.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${Math.random() * 360}deg)`;
  };

  return (
    <>
      <GlobalStyle />
      <Container className={isLoaded ? 'loaded' : ''}>
        <Navbar>
          <LogoContainer>
            <Logo>Joyverse</Logo>
            <LogoStars>
              <Star className="animated-star" color="#FF6B6B" top="-10px" left="15px" size="15px" rotate="15deg" />
              <Star className="animated-star" color="#FFD166" top="5px" left="100px" size="12px" rotate="-10deg" />
            </LogoStars>
          </LogoContainer>
          <MenuItems>
            <MenuItem><StyledLink to="/phonetics-game">Phonetic Sounds</StyledLink></MenuItem>
            <MenuItem><StyledLink to="/">Home</StyledLink></MenuItem>
            <MenuItem><StyledLink to="/about">About</StyledLink></MenuItem>
            <MenuItem><StyledLink to="/faq">FAQ</StyledLink></MenuItem>
            <MenuItem><StyledLink to="/feedback">Feedback</StyledLink></MenuItem>
          </MenuItems>
        </Navbar>

        <ContentWrapper>
          <HeroSection>
            <HeroContent>
              <Headline>Welcome to Joyverse!</Headline>
              <Subheadline>A fun and engaging learning platform for dyslexic children.</Subheadline>
              <ButtonGroup>
                <PrimaryButton to="/child-login">Get Started</PrimaryButton>
                <SecondaryButton to="/about">Learn More</SecondaryButton>
              </ButtonGroup>
            </HeroContent>
            <StarDecorations>
              <Star className="animated-star" color="#FF6B6B" top="20px" right="40px" size="30px" rotate="15deg" />
              <Star className="animated-star" color="#4ECDC4" bottom="30px" left="20px" size="25px" rotate="-10deg" />
              <Star className="animated-star" color="#FFD166" top="60%" right="15%" size="20px" rotate="25deg" />
              <Star className="animated-star" color="#3a86ff" top="30%" left="15%" size="22px" rotate="45deg" />
              <Star className="animated-star" color="#8338ec" bottom="20%" right="25%" size="18px" rotate="10deg" />
            </StarDecorations>
            <BubbleContainer>
              {[...Array(12)].map((_, i) => (
                <Bubble key={i} size={`${Math.random() * 60 + 20}px`} delay={`${Math.random() * 10}s`} duration={`${Math.random() * 10 + 10}s`} />
              ))}
            </BubbleContainer>
          </HeroSection>

          <InfoSection>
            <SectionTitle>
              <SectionTitleText>About Us</SectionTitleText>
              <Underline />
            </SectionTitle>
            <SectionContent>
              Joyverse is a caring digital companion that supports children's emotional growth through play. 
              Our interactive games and emotion-aware activities help therapists guide each child's unique 
              learning journey. By gently tracking responses during sessions, we create meaningful insights 
              while keeping the experience joyful and engaging.
            </SectionContent>
          </InfoSection>

          <FAQSection>
            <SectionTitle>
              <SectionTitleText>FAQ</SectionTitleText>
              <Underline />
            </SectionTitle>
            <FAQAccordion>
              {[
                {
                  question: "How does Joyverse help children during therapy sessions?",
                  answer: "Joyverse uses fun games and activities while quietly observing how children respond emotionally. This helps therapists understand what activities work best for each child and track their progress over time."
                },
                {
                  question: "Is the camera always recording during sessions?",
                  answer: "No, the camera only activates when you start a game or activity. We only use it to help understand emotions during specific activities, and all data is kept private and secure."
                },
                {
                  question: "What kind of games does Joyverse include?",
                  answer: "We have simple, engaging games like word puzzles and matching activities designed to be both fun and helpful for therapy. The games adapt based on what the therapist thinks will help each child most."
                },
                {
                  question: "How do therapists see the results?",
                  answer: "Therapists get a private dashboard showing simple charts about how children responded during different activities. This helps them plan better sessions and see what's working well."
                },
                {
                  question: "Is Joyverse safe for children to use?",
                  answer: "Absolutely! We take privacy and security very seriously. All data is encrypted, and only the child's therapist can access their information. We never share data with third parties."
                }
              ].map((faq, index) => (
                <FAQItem key={index}>
                  <Question>{faq.question}</Question>
                  <Answer>{faq.answer}</Answer>
                </FAQItem>
              ))}
            </FAQAccordion>
          </FAQSection>

          <FeedbackSection>
            <SectionTitle>
              <SectionTitleText>Feedback</SectionTitleText>
              <Underline />
            </SectionTitle>
            <SectionContent>
              We would love to hear your feedback! Your insights help us continuously improve the Joyverse experience for children and parents alike.
            </SectionContent>
            <SectionContent>
              Whether you have suggestions for new features, want to share your success stories, or have identified areas where we could do better, we're eager to listen.
            </SectionContent>
            <SectionContent>
              Our commitment to excellence is driven by the valuable input we receive from our community of users. Together, we can create the most effective and enjoyable learning environment possible.
            </SectionContent>
            <FeedbackButton to="/feedback">
              <ButtonText>Share Your Thoughts</ButtonText>
              <ButtonIcon>→</ButtonIcon>
            </FeedbackButton>
          </FeedbackSection>
        </ContentWrapper>

        <Footer>
          <FooterContent>
            <span>© 2025 Joyverse. All rights reserved.</span>
            <FooterLinks>
              <FooterLink to="/privacy">Privacy</FooterLink>
              <FooterLink to="/terms">Terms</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </FooterLinks>
          </FooterContent>
        </Footer>
      </Container>
    </>
  );
};
// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Poppins', sans-serif;
    overflow-x: hidden;
  }
  
  @keyframes floatStar {
    0% { transform: translate(0, 0) rotate(0); }
    100% { transform: translate(10px, -10px) rotate(15deg); }
  }
`;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const rise = keyframes`
  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const bubble = keyframes`
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(-20vh) scale(1);
    opacity: 0;
  }
`;

// Styled Components
const Container = styled.div`
  font-family: 'Poppins', sans-serif;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: #333;
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
  position: relative;

  /* Set your actual background image here */
  background: url('/images/bg-4.jpg') no-repeat center center fixed;
  background-size: cover;

  &.loaded {
    opacity: 1;
  }

  /* overlays as before, if desired */
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(120deg, rgba(255,255,255,0.6) 0%, rgba(243,247,255,0.6) 100%),
      radial-gradient(circle at 50% 50%, rgba(58,134,255,0.05) 0%, rgba(67,97,238,0.02) 100%);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    z-index: -1;
  }
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233a86ff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.4;
    z-index: -1;
  }
`;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 15px 40px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  animation: ${fadeIn} 0.6s ease forwards;
  transition: padding 0.3s ease, background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.98);
  }
`;

const LogoContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Logo = styled.div`
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;

  &:hover {
    text-shadow: 0 0 15px rgba(58, 134, 255, 0.5);
    letter-spacing: 1px;
  }
`;

const LogoStars = styled.div`
  position: relative;
  width: 120px;
  height: 40px;
`;

const Star = styled.div<{ color: string; top?: string; left?: string; right?: string; bottom?: string; size: string; rotate: string }>`
  position: absolute;
  top: ${props => props.top || 'auto'};
  left: ${props => props.left || 'auto'};
  right: ${props => props.right || 'auto'};
  bottom: ${props => props.bottom || 'auto'};
  width: ${props => props.size};
  height: ${props => props.size};
  background-color: ${props => props.color};
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  transform: rotate(${props => props.rotate});
  z-index: 1;
  transition: transform 0.5s ease, filter 0.5s ease;
  filter: drop-shadow(0 0 3px ${props => props.color}80);

  &:hover {
    filter: drop-shadow(0 0 8px ${props => props.color});
    transform: rotate(${props => props.rotate}) scale(1.2);
  }
`;

const MenuItems = styled.ul`
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
`;

const MenuItem = styled.li`
  margin-left: 25px;
  position: relative;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ActionMenuItem = styled(MenuItem)`
  margin-left: 15px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;

  &:hover {
    color: #3a86ff;
    background-color: rgba(58, 134, 255, 0.08);
  }

  &::before {
    content: "";
    position: absolute;
    width: 0;
    height: 2px;
    bottom: 0;
    left: 50%;
    background: linear-gradient(90deg, #3a86ff, #4361ee);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    transform: translateX(-50%);
    border-radius: 2px;
  }

  &:hover::before {
    width: 80%;
  }
`;

const ActionLink = styled(Link)`
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 15px;
  padding: 10px 18px;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 4px 15px rgba(58, 134, 255, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: 0.5s;
  }

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 18px rgba(58, 134, 255, 0.4);
  }

  &:hover::before {
    left: 100%;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  width: 100%;
  flex: 1;
`;

const HeroSection = styled.section`
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 60px;
  padding: 80px 40px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: ${fadeIn} 0.8s ease 0.2s forwards;
  opacity: 0;
  transform: translateY(20px);
  transition: transform 0.4s ease, box-shadow 0.4s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  }
`;

const HeroContent = styled.div`
  text-align: center;
  position: relative;
  z-index: 2;
`;

const BubbleContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
`;

const Bubble = styled.div<{ size: string; delay: string; duration: string }>`
  position: absolute;
  bottom: -100px;
  left: ${() => Math.random() * 100}%;
  width: ${props => props.size};
  height: ${props => props.size};
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1));
  animation: ${bubble} ${props => props.duration} ease-in infinite ${props => props.delay};
`;

const StarDecorations = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
`;

const Headline = styled.h1`
  font-size: 60px;
  margin-bottom: 24px;
  font-weight: 800;
  background: linear-gradient(45deg, #3a86ff, #4361ee, #8338ec);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
  animation: ${shimmer} 4s linear infinite;
  text-shadow: 0 10px 20px rgba(58, 134, 255, 0.15);
  transition: transform 0.5s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Subheadline = styled.p`
  font-size: 22px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  animation: ${fadeIn} 0.8s ease 0.4s forwards;
  opacity: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  animation: ${fadeIn} 0.8s ease 0.6s forwards;
  opacity: 0;
`;

const PrimaryButton = styled(Link)`
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(45deg, #3a86ff, #4361ee);
  color: white;
  font-weight: 600;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 25px rgba(58, 134, 255, 0.3);
  position: relative;
  overflow: hidden;
  transform-origin: center;

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 30px rgba(58, 134, 255, 0.4);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -60%;
    width: 200%;
    height: 200%;
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(30deg);
    transition: transform 0.6s ease;
  }

  &:hover::after {
    transform: rotate(30deg) translate(10%, 10%);
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-block;
  padding: 14px 32px;
  background: transparent;
  color: #3a86ff;
  font-weight: 600;
  border: 3px solid rgba(58, 134, 255, 0.5);
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0%;
    height: 100%;
    background: rgba(58, 134, 255, 0.1);
    transition: width 0.4s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-5px);
    border-color: #3a86ff;
  }

  &:hover::before {
    width: 100%;
  }
`;

const InfoSection = styled.section`
  text-align: center;
  padding: 60px 40px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  margin-bottom: 40px;
  animation: ${fadeIn} 0.8s ease;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #3a86ff, #4361ee);
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  }
`;

const FAQSection = styled.section`
  padding: 60px 40px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  margin-bottom: 40px;
  animation: ${fadeIn} 0.8s ease;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #4361ee, #3a86ff);
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  }
`;

const FAQAccordion = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  margin-bottom: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.5);
  animation: ${rise} 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  animation-delay: calc(0.1s * var(--index, 0));

  &:nth-child(1) { --index: 1; }
  &:nth-child(2) { --index: 2; }
  &:nth-child(3) { --index: 3; }
  &:nth-child(4) { --index: 4; }
  &:nth-child(5) { --index: 5; }

  &:hover {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-3px);
    border-color: rgba(58, 134, 255, 0.3);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const FeedbackSection = styled.section`
  text-align: center;
  padding: 60px 40px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  animation: ${fadeIn} 0.8s ease;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(90deg, #4361ee, #8338ec);
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  }
`;

const SectionTitle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`;

const SectionTitleText = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 16px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
    color: #3a86ff;
  }
`;

const Underline = styled.div`
  height: 4px;
  width: 70px;
  background: linear-gradient(90deg, #3a86ff, #4361ee);
  border-radius: 4px;
  transition: width 0.3s ease, transform 0.3s ease;

  ${SectionTitle}:hover & {
    width: 100px;
    transform: translateY(2px);
  }
`;

const SectionContent = styled.p`
  font-size: 18px;
  color: #4a5568;
  line-height: 1.8;
  margin-bottom: 28px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  transition: color 0.3s ease;

  &:hover {
    color: #2d3748;
  }
`;

const Question = styled.h3`
  font-weight: 600;
  font-size: 20px;
  color: #3a86ff;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  transition: color 0.3s ease;

  &::before {
    content: '?';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: rgba(58, 134, 255, 0.1);
    color: #3a86ff;
    font-size: 16px;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  ${FAQItem}:hover &::before {
    background-color: #3a86ff;
    color: white;
    transform: scale(1.1);
  }

  ${FAQItem}:hover & {
    color: #4361ee;
  }
`;

const Answer = styled.p`
  font-size: 17px;
  color: #4a5568;
  line-height: 1.7;
  position: relative;
  padding-left: 38px;
  transition: color 0.3s ease;

  ${FAQItem}:hover & {
    color: #2d3748;
  }
`;

const FeedbackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: linear-gradient(45deg, #4361ee, #3a86ff);
  color: white;
  border-radius: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 25px rgba(58, 134, 255, 0.2);
  position: relative;
  overflow: hidden;
  margin-top: 20px;

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 30px rgba(67, 97, 238, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover::before {
    transform: translateX(100%);
  }
`;

const ButtonText = styled.span`
  margin-right: 10px;
  transition: transform 0.3s ease;

  ${FeedbackButton}:hover & {
    transform: translateX(-3px);
  }
`;

const ButtonIcon = styled.span`
  font-size: 20px;
  opacity: 0.8;
  transition: transform 0.3s ease, opacity 0.3s ease;

  ${FeedbackButton}:hover & {
    transform: translateX(3px);
    opacity: 1;
  }
`;

const Footer = styled.footer`
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  padding: 28px 40px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  margin-top: auto;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(67, 97, 238, 0.3), transparent);
  }
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  color: #4a5568;
  font-size: 14px;
  position: relative;
  z-index: 1;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 24px;
`;

const FooterLink = styled(Link)`
  color: #4a5568;
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 5px 8px;
  border-radius: 6px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #3a86ff, #4361ee);
    transition: width 0.3s ease;
    border-radius: 2px;
  }

  &:hover {
    color: #3a86ff;
  }

  &:hover::after {
    width: 100%;
  }
`;

export default Home;