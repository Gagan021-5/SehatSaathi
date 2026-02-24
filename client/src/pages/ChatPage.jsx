import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VoiceInputButton from '../components/common/VoiceInputButton';
import VoiceOutputControls from '../components/common/VoiceOutputControls';
import VoiceChat from '../components/chat/VoiceChat';
import { sendChatMessage } from '../services/api';
import './ChatPage.css';

export default function ChatPage() {
    const { t, currentLanguage } = useLanguage();
    const [mode, setMode] = useState('text');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text) => {
        const msg = text || input.trim();
        if (!msg || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);
        try {
            const res = await sendChatMessage({ message: msg, language: currentLanguage.code, sessionId });
            const reply = res.data?.reply || res.data?.message || 'No response received.';
            if (res.data?.sessionId) setSessionId(res.data.sessionId);
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: t('common.error') }]);
        }
        setLoading(false);
    };

    const handleVoiceTranscript = (text) => {
        if (text) { setInput(text); handleSend(text); }
    };

    if (mode === 'voice') return (
        <div>
            <div className="chat-mode-toggle">
                <button className="chat-mode-btn" onClick={() => setMode('text')}>💬 {t('nav.chat')}</button>
                <button className="chat-mode-btn chat-mode-active">🎤 Voice</button>
            </div>
            <VoiceChat />
        </div>
    );

    return (
        <div className="chat-page">
            <div className="chat-header">
                <div>
                    <h1 className="chat-title">{t('chat.title')}</h1>
                    <p className="chat-subtitle">{t('chat.subtitle')}</p>
                </div>
                <div className="chat-mode-toggle">
                    <button className="chat-mode-btn chat-mode-active">💬 Text</button>
                    <button className="chat-mode-btn" onClick={() => setMode('voice')}>🎤 Voice</button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">👨‍⚕️</div>
                        <h2>{t('chat.title')}</h2>
                        <p>{t('chat.subtitle')}</p>
                        <div className="chat-quick-symptoms">
                            {['Fever & headache', 'Stomach pain', 'Cold & cough', 'Skin rash'].map((s, i) => (
                                <button key={i} className="chat-quick-btn" onClick={() => handleSend(s)}>{s}</button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
                        {msg.role === 'assistant' && <div className="chat-msg-avatar">🤖</div>}
                        <div className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                            <p className="chat-msg-text">{msg.content}</p>
                            {msg.role === 'assistant' && (
                                <div className="chat-msg-actions">
                                    <VoiceOutputControls text={msg.content} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="chat-msg chat-msg-ai">
                        <div className="chat-msg-avatar">🤖</div>
                        <div className="chat-bubble-ai chat-bubble-loading">
                            <div className="chat-dots"><span /><span /><span /></div>
                            <span className="chat-thinking-text">{t('chat.thinking')}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-bar">
                <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} placeholder={t('chat.placeholder')} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={loading} />
                <VoiceInputButton onTranscript={handleVoiceTranscript} size="md" />
                <button className="chat-send-btn" onClick={() => handleSend()} disabled={!input.trim() || loading}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </button>
            </div>
        </div>
    );
}
