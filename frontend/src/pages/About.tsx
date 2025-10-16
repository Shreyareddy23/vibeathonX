import Navbar from '../components/Navbar';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-8">About Us</h1>
        <div className="prose prose-lg max-w-none">
          <p>
            JoyVerse is an innovative educational platform designed to make learning fun and engaging for children.
            Our mission is to combine therapeutic practices with interactive games to create an environment where
            children can develop their skills while having fun.
          </p>
          <p>
            We work closely with therapists and educational experts to ensure our games and activities provide
            meaningful learning experiences while maintaining the highest standards of engagement and enjoyment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About; 