import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { MessageSquare, X, Send } from "lucide-react";
import "./ChatBot.css";

const chatMenus = {
  main: [
    { label: "💰 Check Balance", action: "Check my current account balance" },
    { label: "📈 Investment Advice", nextMenu: "investment" },
    { label: "🛡️ Report Fraud", nextMenu: "fraud" },
    { label: "💳 Spending Analysis", action: "Analyze my spending patterns" }
  ],
  investment: [
    { label: "Start a SIP", action: "I want to start a SIP investment" },
    { label: "Risk Profile", action: "What is my risk profile?" },
    { label: "🔙 Back to Main", nextMenu: "main" }
  ],
  fraud: [
    { label: "Report Transaction", action: "I want to report a suspicious transaction" },
    { label: "Block Card", action: "How do I block my debit card?" },
    { label: "🔙 Back to Main", nextMenu: "main" }
  ]
};

export default function ChatBot(){

    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [currentMenu, setCurrentMenu] = useState("main");

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isOpen, currentMenu]);

    const handleMenuOption = (option) => {
        if (option.nextMenu) {
            setCurrentMenu(option.nextMenu);
            return;
        }

        if (option.action) {
            handleSend(option.action);
        }
    };

    const handleSend = async (text) => {
        if (!text.trim()) return;

        const newuserMessage = { role: "user", text: text };
        setChatHistory(prev => [...prev, newuserMessage]);

        setLoadingStatus(true);
        setQuestion("");

        try {
            const response = await axios.post("http://localhost:8000/ask", {
                question: text,
                history: chatHistory
            });

            const botMessage = { role: "model", text: response.data.finalData };
            setChatHistory(prev => [...prev, botMessage]);

        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, {
                role: "model",
                text: "⚠️ Error connecting to server."
            }]);

        } finally {
            setLoadingStatus(false);
        }
    };

    const onFormSubmit = (e) => {
        e.preventDefault();
        handleSend(question);
    };

    return (
        <div className="chatbot-container">

            {isOpen && (
                <div className="chat-window">

                    <div className="chat-header">
                        <div>
                            <h3>Ask Hisaab</h3>
                            <p>Your AI Financial Assistant</p>
                        </div>

                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="chat-history">

                        {chatHistory.length === 0 && (
                            <div className="welcome-msg">
                                👋 Hi! How can I help you today?
                            </div>
                        )}

                        {chatHistory.map((msg, index) => (
                            <div
                                key={index}
                                className={`message-row ${msg.role}`}
                            >
                                <div className="message-bubble">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}

                        {loadingStatus &&
                            <div className="typing">Typing...</div>
                        }

                        {!loadingStatus && (
                            <div className="menu-options">
                                {chatMenus[currentMenu].map((option, index) => (
                                    <button
                                        key={index}
                                        className="menu-btn"
                                        onClick={() => handleMenuOption(option)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={chatEndRef}></div>

                    </div>

                    <form
                        className="chat-input-area"
                        onSubmit={onFormSubmit}
                    >
                        <input
                            type="text"
                            value={question}
                            onChange={(e)=>setQuestion(e.target.value)}
                            placeholder="Type a message..."
                        />

                        <button
                            type="submit"
                            disabled={loadingStatus}
                        >
                            <Send size={18}/>
                        </button>
                    </form>

                </div>
            )}

            <button
                className="floating-btn"
                onClick={()=>setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={28}/> : <MessageSquare size={28}/>}
            </button>

        </div>
    );
}