import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, X, Factory, Bot, ShieldCheck } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'สวัสดีครับพี่ๆ ทีมงาน! ระบบฐานข้อมูลเครื่อง Domae Auto Thermal Welding พร้อมใช้งานแล้วครับ มีปัญหาตรงไหน หรือต้องการดูพารามิเตอร์อะไร พิมพ์ถามมาได้เลยครับ 🏭🔥' }
  ]);
  const [inputText, setInputText] = useState('');
  const [sheetKnowledge, setSheetKnowledge] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isKnowledgeReady, setIsKnowledgeReady] = useState(false);
  const messagesEndRef = useRef(null);

  // ใส่ API Key ของ Gemini ตรงนี้
  const myKey = import.meta.env.VITE_GEMINI_API_KEY; 
  // ลิงก์ SheetDB 
  const sheetDB_URL = "https://sheetdb.io/api/v1/dg3h9mlyf4s6q"; 

  useEffect(() => {
    fetch(sheetDB_URL).then(res => res.json()).then(data => {
      const allInfo = data.map(item => item.knowledge_data).join('\n---\n');
      setSheetKnowledge(allInfo);
      setIsKnowledgeReady(true);
    }).catch(err => {
      console.error("โหลดข้อมูลไม่สำเร็จ");
      setIsKnowledgeReady(false);
    });
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSubmit = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const textToSend = quickText || inputText;
    
    if (!textToSend.trim() || isGenerating) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${myKey}`;
      const systemPrompt = `คุณคือวิศวกรผู้ช่วยส่วนตัวที่ถูกพัฒนาโดย Rattanachot S. มีหน้าที่ช่วยเหลือช่างเทคนิคหน้างานในการควบคุมเครื่อง "Domae Auto Thermal Welding machine" 
      ตอบคำถามโดยอ้างอิงจากข้อมูลนี้เท่านั้น:\n${sheetKnowledge}\n
      กฎสำคัญ: 
      1. หากไม่มีข้อมูลในฐานข้อมูล ให้บอกอย่างสุภาพว่า "ยังไม่มีข้อมูลส่วนนี้บันทึกไว้ครับ รบกวนติดต่อวิศวกรผู้ดูแล"
      2. ใช้คำพูดเป็นกันเอง ให้เกียรติช่างหน้างาน (เรียกผู้ใช้ว่า "พี่ๆ" หรือ "พี่ช่าง")
      3. ผู้ใช้ถามภาษาไหน (ไทย/English) ให้ตอบกลับเป็นภาษานั้นเสมอ`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nคำถาม: ${textToSend}` }] }] })
      });

      const result = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: result.candidates[0].content.parts[0].text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "ขออภัยครับพี่ ระบบขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะครับ 🔧" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Overlay สำหรับมือถือ */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-amber-950 text-amber-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-xl`}>
        <div className="p-6 flex items-center justify-between border-b border-amber-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <Factory size={28} className="text-amber-500" />
            </div>
            <h1 className="text-lg font-bold leading-tight">Domae Auto<br/>Thermal Welding</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-amber-400 p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 flex-1">
          <p className="text-sm text-amber-200/70 mb-6 uppercase tracking-wider font-semibold">System Status</p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 bg-amber-900/30 p-3 rounded-xl border border-amber-800/50">
              <ShieldCheck size={20} className="text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Database Sync</p>
                <p className="text-xs text-amber-400/70">{isKnowledgeReady ? 'Connected via SheetDB' : 'Connecting...'}</p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${isKnowledgeReady ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            </div>
          </div>
        </div>

        {/* ตัด Support Info ออก และดัน Credit ลงมาล่างสุดแบบคลีนๆ */}
        <div className="p-6 border-t border-amber-900/50 bg-amber-950">
          <p className="text-xs text-amber-500/50 text-center font-mono">DEV BY RATTANACHOT S.</p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative w-full">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center px-4 justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <Bot size={24} className="text-amber-600" />
              <h2 className="font-bold text-slate-800">Welding Assistant AI</h2>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] md:max-w-[75%] p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${m.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col space-y-3">
            
            {/* Quick Replies */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => handleSubmit(null, "Standard parameter")}
                disabled={isGenerating}
                className="whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                ⚡ Standard parameter
              </button>
            </div>

            {/* Chat Form */}
            <form onSubmit={(e) => handleSubmit(e)} className="flex items-end space-x-2">
              <textarea 
                value={inputText} 
                onChange={(e)=>setInputText(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows="1"
                className="flex-1 border border-slate-300 p-3 md:p-4 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-slate-50 resize-none max-h-32 text-sm md:text-base" 
                placeholder="พิมพ์คำถาม หรือระบุปัญหาที่พบ..." 
              />
              <button 
                type="submit"
                disabled={isGenerating || !inputText.trim()} 
                className="bg-amber-600 text-white p-3 md:p-4 rounded-2xl font-bold hover:bg-amber-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors flex items-center justify-center h-[52px] w-[52px] md:h-[56px] md:w-[56px] shrink-0"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default App;
