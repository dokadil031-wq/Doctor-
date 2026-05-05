import { ArrowLeft, Send } from 'lucide-react';
import { GoToType } from '../types';
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export function SupportChat({ goTo }: { goTo: GoToType }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Namaste! Main apki kaise madad kar sakta hoon? (How can I help you today?)' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      chatRef.current = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a helpful customer support chatbot for an app that helps users book tokens with doctors in Hindi and English. Keep your answers short, polite, and helpful."
        }
      });
    } catch(e) {
      console.error("Failed to initialize chat", e);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;
    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage.text });
      setMessages(prev => [...prev, { id: Date.now().toString() + 'bot', sender: 'bot', text: response.text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'error', sender: 'bot', text: 'Maaf kijiye, kuch error aa gaya. (Sorry, an error occurred.)' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="pb-10 bg-[#f5f7fa] h-full flex flex-col">
      <div className="bg-white px-5 pt-12 pb-4 border-b border-slate-100 flex items-center gap-3">
         <button onClick={() => goTo('profile', true)} className="text-text-muted active:opacity-70">
           <ArrowLeft className="w-5 h-5" />
         </button>
         <div>
            <h1 className="text-lg font-bold text-text-main font-nunito">Help & Support</h1>
            <p className="text-xs text-text-muted">Chat with our AI Assistant</p>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl p-3 text-sm ${msg.sender === 'user' ? 'bg-brand-teal text-white rounded-br-sm' : 'bg-white border border-slate-200 text-text-main rounded-bl-sm shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-text-muted rounded-2xl rounded-bl-sm p-3 text-sm shadow-sm flex gap-1">
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <input 
             type="text"
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyPress={e => e.key === 'Enter' && handleSend()}
             placeholder="Type your message..."
             className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm outline-none focus:border-brand-teal"
          />
          <button 
             onClick={handleSend}
             disabled={!input.trim() || isTyping}
             className="bg-brand-teal text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
          >
             <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
