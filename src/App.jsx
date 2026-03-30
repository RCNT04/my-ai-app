import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Database, 
  Settings, 
  Trash2, 
  FileText, 
  Bot, 
  User,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info,
  Upload,
  Globe
} from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'สวัสดีครับเพื่อน! ผมบอทสุดฉลาดของคุณเอง พร้อมตอบคำถามจากฐานข้อมูลแล้วครับ' }
  ]);
  const [inputText, setInputText] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [outputLanguage, setOutputLanguage] = useState('Thai');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
const apiKey = "AIzaSyALw-UizoyFLREegE_I6BaUgXNIYhF41DM";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // ฟังก์ชันอัปโหลดไฟล์ (.txt, .csv)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "text/plain" || file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setKnowledgeBase(prev => prev + (prev ? "\n\n" : "") + event.target.result);
      };
      reader.readAsText(file);
    } else {
      alert("ตอนนี้รับเฉพาะไฟล์ .txt นะครับเพื่อน! ถ้าเป็น PDF/Excel รบกวน Copy ข้อความมาวางแทนก่อนน้า");
    }
    e.target.value = null;
  };

  const fetchGeminiResponse = async (userPrompt, context) => {
    if (!apiKey) {
      throw new Error("อย่าลืมใส่ API Key นะครับเพื่อน! (ดูที่คอมเมนต์บรรทัดที่ 31)");
    }

    const systemPrompt = `You are a specialized assistant. 
    KNOWLEDGE BASE: ${context || "No specific knowledge base provided yet."}
    
    INSTRUCTIONS:
    1. Answer questions ONLY based on the provided KNOWLEDGE BASE if relevant.
    2. If the knowledge base doesn't contain the answer, politely inform the user.
    3. Keep answers concise and accurate.
    4. ALWAYS respond and translate the output into ${outputLanguage} language.`;

    const payload = {
      contents: [{ parts: [{ text: `Based on the context, answer this: ${userPrompt}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        if (i === 4) throw err;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);
    setError(null);

    try {
      const aiResponse = await fetchGeminiResponse(inputText, knowledgeBase);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: `ล้างแชทเรียบร้อย! ตอนนี้ผมพร้อมตอบเป็นภาษา ${outputLanguage} แล้วครับ` }]);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setOutputLanguage(newLang);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `[ระบบ] 🌐 สลับโหมดเป็นภาษา ${newLang} เรียบร้อยแล้ว จัดมาเลยครับ!` 
    }]);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-indigo-600">
            <Database size={20} />
            <span>ฐานข้อมูลเฉพาะทาง</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-100 rounded">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {/* โซนเลือกภาษา */}
          <div className="space-y-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <label className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
              <Globe size={16} className="text-indigo-600" />
              ภาษาที่ให้บอทตอบ
            </label>
            <select 
              value={outputLanguage} 
              onChange={handleLanguageChange}
              className="w-full p-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer font-medium text-slate-700"
            >
              <option value="Thai">🇹🇭 ภาษาไทย</option>
              <option value="English">🇬🇧 English</option>
              <option value="Japanese">🇯🇵 日本語 (Japanese)</option>
              <option value="Chinese">🇨🇳 中文 (Chinese)</option>
              <option value="Korean">🇰🇷 한국어 (Korean)</option>
            </select>
          </div>

          {/* โซนอัปโหลดและฐานข้อมูล */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText size={16} />
                ข้อมูลอ้างอิง (Context)
              </label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".txt,.csv" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Upload size={14} />
                อัปโหลด .txt
              </button>
            </div>
            <textarea
              className="w-full h-48 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none bg-white shadow-inner"
              placeholder="วางข้อมูล กฎเกณฑ์ หรือเนื้อหาที่ต้องการให้บอทเรียนรู้ที่นี่..."
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <Trash2 size={16} />
            ล้างกระดาน
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center gap-3 sticky top-0 z-10">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <Settings size={20} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-bold text-slate-800 text-lg">SmartDoc AI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${knowledgeBase ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                {knowledgeBase ? 'Database Active' : 'Waiting for Data...'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-slate-200'
                }`}>
                  {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-indigo-600" />}
                </div>
                
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Bot size={20} className="text-indigo-600" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                  <Loader2 className="animate-spin text-indigo-600" size={18} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 shadow-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`พิมพ์คำถาม... (บอทจะตอบเป็นภาษา ${outputLanguage})`}
              className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm shadow-inner"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !inputText.trim()}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                isGenerating || !inputText.trim() 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5'
              }`}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;
