import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { MessageSquare, X, Send } from "lucide-react";

const chatMenus = {
  main: [
    { label: "💰 Check Balance", action: "Check my current account balance" },
    { label: "📈 Investment Advice", nextMenu: "investment" }, // Go to sub-menu
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
    const [currentMenu, setCurrentMenu] = useState("main"); // Tracks which menu to show
    
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isOpen, currentMenu]); // Scroll when menu changes too

    // --- 2. FUNCTION TO HANDLE MENU CLICKS ---
    const handleMenuOption = (option) => {
        // If this option leads to another menu (like "Investment Advice" -> Submenu)
        if (option.nextMenu) {
        setCurrentMenu(option.nextMenu);
        return; 
        }

        // If it's a final action, send it as a message
        if (option.action) {
        handleSend(option.action);
        }
    };

    // Helper to send message (reused by both Input box and Menu buttons)
    const handleSend = async (text) => {
        if (!text.trim()) return;

        const newuserMessage = { role: "user", text: text };
        const updatedHistory = [...chatHistory, newuserMessage];
        setChatHistory(updatedHistory);
        setLoadingStatus(true);
        setQuestion(""); // Clear input box if used

        try {
        const response = await axios.post("http://localhost:8000/ask", {
            question: text,
            history: chatHistory
        });
        const botMessage = { role: "model", text: response.data.finalData };
        setChatHistory((prev) => [...prev, botMessage]);
        } catch (error) {
        console.error(error);
        setChatHistory((prev) => [...prev, { role: "model", text: "⚠️ Error connecting to server." }]);
        } finally {
        setLoadingStatus(false);
        // Optional: Reset to main menu after a question is answered? 
        // setCurrentMenu("main"); 
        }
    };

    const onFormSubmit = (e) => {
        e.preventDefault();
        handleSend(question);
    };

    return (
        <div className="font-sans">
        
        {isOpen && (
            <div className="fixed bottom-20 right-6 w-[400px] h-[600px] bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
                <div>
                <h3 className="font-bold text-xl">Lekha Bot</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-blue-600 p-1 rounded">
                <X size={20} />
                </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {chatHistory.length === 0 && (
                <div className="text-gray-500 text-center text-lg mt-10">
                    <p>👋 Hi! How can I help you today?</p>
                </div>
                )}
                
                {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                    }`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                </div>
                ))}
                
                {loadingStatus && <div className="text-gray-400 text-s ml-2 animate-pulse">Typing...</div>}
                
                {/* --- 3. THE MENU OPTIONS (Chips) --- */}
                {/* Only show menu if not loading */}
                {!loadingStatus && (
                <div className="flex flex-col gap-2 mt-8">
                    {chatMenus[currentMenu].map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleMenuOption(option)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-s font-semibold py-2 px-3 rounded-full border border-blue-200 transition-colors"
                    >
                        {option.label}
                    </button>
                    ))}
                </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={onFormSubmit} className="p-3 bg-white border-t flex gap-2">
                <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button 
                type="submit" 
                disabled={loadingStatus}
                className="bg-blue-700 text-white p-2 rounded-md hover:bg-blue-800 disabled:opacity-50"
                >
                <Send size={18} />
                </button>
            </form>
            </div>
        )}

        {/* Floating Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-700 text-white rounded-full shadow-lg hover:bg-blue-800 flex items-center justify-center transition-transform hover:scale-110 z-50"
        >
            {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>

        </div>
  );
}