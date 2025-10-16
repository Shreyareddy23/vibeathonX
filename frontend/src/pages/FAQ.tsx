import { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQ = () => {
  const faqs: FAQItemProps[] = [
    {
      question: "What is JoyVerse?",
      answer: "JoyVerse is an educational gaming platform that combines therapeutic practices with fun, interactive games to help children develop various skills."
    },
    {
      question: "How does it work?",
      answer: "Therapists can sign up and assign specific games to their clients. Children can then log in and play these assigned games, which are designed to be both fun and educational."
    },
    {
      question: "Is it safe for children?",
      answer: "Yes, JoyVerse is designed with child safety in mind. All content is age-appropriate and monitored. Children can only access games assigned by their therapist."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-8">Frequently Asked Questions</h1>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border-b border-purple-200 pb-4"
      initial={false}
    >
      <button
        className="flex justify-between items-center w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-semibold text-purple-800">{question}</h3>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 text-gray-600"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQ; 