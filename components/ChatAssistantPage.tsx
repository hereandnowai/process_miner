
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProcessEvent, ChatMessage, AlertNotification } from '../types';
import { geminiService } from '../services/geminiService';
import { PaperAirplaneIcon, MicrophoneIcon, StopCircleIcon, UserCircleIcon, CpuChipIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

interface ChatAssistantPageProps {
  processDataContext: ProcessEvent[] | null;
  addAlert: (type: AlertNotification['type'], message: string) => void;
}

// Check for SpeechRecognition and SpeechSynthesis API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = true; // Get interim results for real-time feedback
}
const speechSynthesis = window.speechSynthesis;


const ChatAssistantPage: React.FC<ChatAssistantPageProps> = ({ processDataContext, addAlert }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true); // User preference for AI speech
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!SpeechRecognition) {
      addAlert('warning', "Voice input is not supported by your browser.");
    }
    if (!speechSynthesis) {
      addAlert('warning', "Speech output is not supported by your browser.");
      setSpeechEnabled(false);
    }
  }, [addAlert]);

  const speakText = useCallback((text: string) => {
    if (!speechSynthesis || !speechEnabled) return;
    try {
        speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            addAlert('error', `Speech synthesis failed: ${event.error}`);
            setIsSpeaking(false);
        };
        speechSynthesis.speak(utterance);
    } catch(e) {
        console.error("Error initiating speech synthesis:", e);
        addAlert('error', "Could not initiate speech output.");
        setIsSpeaking(false);
    }
  }, [addAlert, speechEnabled]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const aiResponseText = await geminiService.processQuery(text.trim(), processDataContext);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      if(speechEnabled) speakText(aiResponseText);
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      addAlert('error', `AI chat error: ${error.message}`);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [processDataContext, addAlert, speakText, speechEnabled]);

  const toggleRecording = () => {
    if (!recognition) {
        addAlert('error', "Voice input not supported or permission denied.");
        return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setInputText(''); // Clear text input when starting new recording
      recognition.start();
      setIsRecording(true);
      addAlert('info', 'Listening... Speak now.');
    }
  };

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInputText(finalTranscript || interimTranscript); // Show interim for real-time feedback
      if (finalTranscript) {
        // Automatically send message when speech recognition finalizes
        // handleSendMessage(finalTranscript.trim()); // Decided against auto-send for better UX control
      }
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      addAlert('error', `Speech recognition error: ${event.error}. Please ensure microphone access.`);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      // No automatic send on 'onend' if user stops manually or speech naturally ends.
      // User can then review/edit and hit send.
    };
     // Cleanup function
    return () => {
        if (recognition) {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.abort(); // Ensure recognition is stopped when component unmounts
        }
        if (speechSynthesis) {
            speechSynthesis.cancel(); // Cancel any speech
        }
    };
  }, [addAlert]); // Removed handleSendMessage from deps to avoid re-binding issues, it's called manually.

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };
  
  const toggleSpeechOutput = () => {
    setSpeechEnabled(prev => {
        const newState = !prev;
        if (!newState && speechSynthesis) {
            speechSynthesis.cancel(); // Stop any current speech if disabling
            setIsSpeaking(false);
        }
        addAlert('info', `AI speech output ${newState ? 'enabled' : 'disabled'}.`);
        return newState;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[700px] glassmorphism animate-fadeIn overflow-hidden">
      <header className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">AI Chat Assistant</h2>
        <button 
            onClick={toggleSpeechOutput} 
            className={`p-2 rounded-full hover:bg-slate-600 transition-colors ${speechEnabled ? 'text-brand-teal' : 'text-gray-400'}`}
            title={speechEnabled ? 'Disable AI Speech' : 'Enable AI Speech'}
        >
            {speechEnabled ? <SpeakerWaveIcon className="h-6 w-6" /> : <SpeakerXMarkIcon className="h-6 w-6" />}
        </button>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-lg lg:max-w-xl ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.sender === 'ai' && <CpuChipIcon className="h-8 w-8 text-brand-teal rounded-full p-1 mr-2 flex-shrink-0" />}
              {msg.sender === 'user' && <UserCircleIcon className="h-8 w-8 text-brand-gold rounded-full p-1 ml-2 flex-shrink-0" />}
              <div className={`px-4 py-3 rounded-xl shadow-md ${
                msg.sender === 'user' 
                ? 'bg-brand-teal text-white rounded-br-none' 
                : 'bg-slate-700 text-gray-200 rounded-bl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-teal-200' : 'text-gray-400'} text-right`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isSending && messages[messages.length-1]?.sender === 'user' && (
           <div className="flex justify-start">
             <div className="flex items-start max-w-xs">
                <CpuChipIcon className="h-8 w-8 text-brand-teal rounded-full p-1 mr-2 flex-shrink-0" />
                <div className="px-4 py-3 rounded-lg shadow-md bg-slate-700 text-gray-200 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={toggleRecording}
            disabled={!SpeechRecognition || isSending}
            className={`p-3 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-teal ${
              isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? <StopCircleIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Type your message or use microphone..."}
            className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none transition-shadow"
            disabled={isSending || isRecording}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || isRecording}
            className="p-3 bg-brand-teal hover:bg-brand-teal/80 text-white rounded-full transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-brand-teal"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistantPage;
    