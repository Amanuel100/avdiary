import { MessageCircle } from 'lucide-react';

export default function FloatingButton() {
  const handleClick = () => {
    alert('AI Chat will be available soon!');
    // Later: navigate('/chat')
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-av-primary text-white p-4 rounded-full shadow-av-glow 
                 hover:bg-blue-600 active:scale-95 transition-all animate-pulse-slow"
      title="Chat with AvDiary AI"
    >
      <MessageCircle size={24} />
    </button>
  );
}