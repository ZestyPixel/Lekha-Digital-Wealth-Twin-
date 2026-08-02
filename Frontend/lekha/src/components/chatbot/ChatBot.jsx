import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, X, Send } from "lucide-react";
import "./ChatBot.css";
import { useAuth } from "../../context/useAuth";
import { useTranslation } from "react-i18next";

const chatMenus = {
  main: [
    { label: "💰 Financial Health", action: "Analyze my financial health." },
    {
      label: "📈 My Goals",
      action: "Check my current goals and progress with regards to finances.",
    },
    { label: "💳 My Investments", action: "Analyze my investments." },
  ],
};

export default function ChatBot() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [currentMenu, setCurrentMenu] = useState("main");

  const chatEndRef = useRef(null);
  const { requestWithAuth } = useAuth();

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

    const userMessage = { role: "user", text };
    const nextHistory = [...chatHistory, userMessage];
    setChatHistory(nextHistory);

    setLoadingStatus(true);
    setQuestion("");
    const currentLanguage = i18n.language || "en";
    try {
      const response = await requestWithAuth("/chatbot", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: nextHistory.slice(-10), // last 10 messages only
          language: currentLanguage,
        }),
      });

      const data = await response.json();
      const botMessage = { role: "model", text: data.finalData };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: "⚠️ Error connecting to server.",
        },
      ]);
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
              <p>Your Financial Assistant</p>
            </div>

            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-history">
            {chatHistory.length === 0 && (
              <div className="welcome-msg">
                👋 Hi! How can I help you today?
              </div>
            )}

            {chatHistory.map((msg, index) => (
              <div key={index} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}

            {loadingStatus && <div className="typing">Typing...</div>}

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

          <form className="chat-input-area" onSubmit={onFormSubmit}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type a message..."
            />

            <button type="submit" disabled={loadingStatus}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button className="floating-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}