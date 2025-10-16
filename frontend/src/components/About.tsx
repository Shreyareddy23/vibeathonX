import React from 'react';
import { CSSProperties } from 'react';

const About = () => {
  const styles: Record<string, CSSProperties> = {
    container: {
      backgroundImage: `url('/images/bg-4.jpg')`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      width: '100%',
      height: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      padding: '6rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      textAlign: 'center',
      overflowY: 'auto',
    },
    contentWrapper: {
      position: 'relative',
      width: '100%',
      zIndex: 1,
    },
    dateTimeInfo: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      textAlign: 'right',
      color: '#000000',
      fontSize: '1rem',
      fontWeight: '500',
      zIndex: 2
    },
    mainHeading: {
      fontSize: '3rem',
      marginBottom: '1.5rem',
      color: '#00008B',
      fontWeight: 700,
      letterSpacing: '-0.5px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    mainDescription: {
      fontSize: '1.2rem',
      maxWidth: '700px',
      marginBottom: '4rem',
      color: '#000000',
      lineHeight: 1.8,
      fontWeight: 400,
      margin: '0 auto', // Added this to center horizontally
      textAlign: 'center', // Ensures text is centered within the container
    },
    
    sectionContainer: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 0'
    },
    sectionHeading: {
      fontSize: '2.25rem',
      marginBottom: '3rem',
      color: '#00008B',
      fontWeight: 600,
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '3rem',
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    card: {
      padding: '1.5rem',
      backgroundColor: 'transparent',
      borderRadius: '8px',
      border: '1px solid #00008B'
    },
    cardTitle: {
      fontSize: '1.5rem',
      marginBottom: '1rem',
      color: '#00008B',
      fontWeight: 600,
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    cardText: {
      color: '#000000',
      lineHeight: 1.6,
      fontSize: '1.1rem'
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '2rem',
      width: '100%',
      maxWidth: '1000px',
      margin: '3rem auto',
      padding: '2rem',
      backgroundColor: 'transparent',
      borderRadius: '12px'
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem'
    },
    statNumber: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#00008B',
      marginBottom: '0.5rem',
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    statLabel: {
      fontSize: '1.1rem',
      color: '#000000',
      fontWeight: 500
    },
    missionSection: {
      backgroundColor: 'transparent',
      padding: '3rem',
      borderRadius: '12px',
      margin: '4rem auto',
      maxWidth: '1000px',
      width: '100%',
      border: '1px solid #00008B'
    },
    timeline: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 0'
    },
    timelineItem: {
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'flex-start',
      textAlign: 'left'
    },
    timelineYear: {
      minWidth: '100px',
      fontWeight: 600,
      color: '#00008B',
      fontSize: '1.2rem',
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    timelineContent: {
      flex: 1,
      paddingBottom: '2rem',
      borderBottom: '1px solid #00008B'
    }
  };

  return (
<div style={styles.container}>
  <div style={styles.contentWrapper}>
    <h1 style={styles.mainHeading}>
      About Joyverse
    </h1>
    
    <p style={styles.mainDescription}>
      Joyverse is a compassionate digital space designed to support children through therapeutic and educational interactions.
      By combining emotion recognition, interactive games, and session tracking, we help therapists and educators understand 
      each child’s emotional journey — one session at a time.
    </p>

    <div style={styles.sectionContainer}>
      <h2 style={styles.sectionHeading}>Our Purpose</h2>
      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Empathy through Technology</h3>
          <p style={styles.cardText}>
            We believe that technology should serve as a bridge, not a barrier. Joyverse uses facial emotion recognition 
            to give therapists deeper insight into how a child feels — even when words fall short.
          </p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Clarity for Every Session</h3>
          <p style={styles.cardText}>
            Each session is more than just play — it's a window into a child's world. We track themes, emotions, 
            and engagement, offering clear and meaningful reports to therapists and caregivers.
          </p>
        </div>
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Personalized Growth</h3>
          <p style={styles.cardText}>
            Every child is unique. Joyverse adapts to emotional patterns and helps caregivers tailor their approach 
            with care, understanding, and data-driven insights.
          </p>
        </div>
      </div>
    </div>

    <div style={styles.missionSection}>
      <h2 style={styles.sectionHeading}>Our Mission</h2>
      <p style={styles.mainDescription}>
        To create a supportive digital environment where children feel seen, understood, and encouraged — 
        while empowering therapists and educators with tools that bring emotional clarity and personalized care.
      </p>
    </div>
  </div>
</div>

  );
};

export default About;