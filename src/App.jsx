import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Menu, 
  X, 
  Factory, 
  Bot, 
  ShieldCheck, 
  RefreshCcw, 
  Zap, 
  User,
  Settings,
  Flame,
  Info,
  Cpu
} from 'lucide-react';

const App = () => {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'สวัสดีครับพี่ๆ ทีมงาน! ระบบ Domae Auto Thermal Welding Machine พร้อมลุยครับ พัฒนาโดยคุณ Rattanachot S. มีคำถามเรื่องปัญหาหน้างาน พิมพ์ถามได้เลยครับ! 🏭🔥' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sheetKnowledge, setSheetKnowledge] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, loading, success, error
  const messagesEndRef = useRef(null);

  // --- CONFIGURATION ---
  // API Key will be injected by the environment safely
  const apiKey = ""; 
  const sheetDB_URL = "https://sheetdb.io/api/v1/dg3h9mlyf4s6q"; 

  // --- AUTO SCROLL ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- KNOWLEDGE BASE SYNC (SheetDB) ---
  const fetchKnowledge = async () => {
    setSyncStatus('loading');
    try {
      const res = await fetch(sheetDB_URL);
      if (!res.ok) throw new Error("Connection failed");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const allInfo = data
          .map(item => item.knowledge_data || item.Knowledge || "")
          .filter(Boolean)
          .join('\n---\n');
        setSheetKnowledge(allInfo);
        setSyncStatus('success');
      } else {
        throw new Error("Invalid data structure");
      }
    } catch (err) {
      console.error("Knowledge Sync Error:", err);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  // --- AI HANDLER (Gemini 2.5 Flash Preview) ---
  const handleSubmit = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const textToSend = quickText || inputText;
    
    if (!textToSend.trim() || isGenerating) return;

    // Add user message to UI
    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    const fetchWithRetry = async (retries = 0) => {
      try {
        const systemPrompt = `คุณคือวิศวกรผู้ช่วยอาวุโส (Senior Engineering Assistant) พัฒนาโดยคุณ "บอล รัตนโชติ" (Rattanachot S.) 
        ทำหน้าที่ช่วยเหลือทีมช่างและพนักงานคุมเครื่อง "Domae Auto Thermal Welding Machine"
        จงตอบคำถามโดยใช้ฐานความรู้ที่ได้รับมอบหมายนี้เท่านั้น:
        ---
        ${sheetKnowledge || "ยังไม่มีข้อมูลในระบบ"}
        ---
        กฎเหล็ก:
        1. หากไม่มีข้อมูลในฐานความรู้ ให้ตอบอย่างสุภาพว่า "ข้อมูลส่วนนี้ยังไม่ได้บันทึกครับ รบกวนพี่ช่างแจ้งคุณ Rattanachot S. เพื่อทำการอัปเดตระบบนะครับ"
        2. ถามภาษาไทยตอบภาษาไทย ถามภาษาอังกฤษตอบภาษาอังกฤษ เสมอ
        3. เรียกผู้ใช้ว่า "พี่ๆ" หรือ "พี่ช่าง" เพื่อให้เกียรติทีมงานหน้างาน
        4. จัดรูปแบบคำตอบให้เป็นข้อๆ (Bullet points) ให้อ่านง่ายบนจอมือถือหน้างาน`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nคำถามจากพี่ช่าง: ${textToSend}` }] }]
          })
        });

        if (!response.ok) {
            const errorInfo = await response.json();
            throw new Error(errorInfo?.error?.message || "Communication Error");
        }

        const result = await response.json();
        const botResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (botResponse) {
          setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
        } else {
          throw new Error("Empty Response from AI");
        }
      } catch (err) {
        if (retries < 3) {
          const delay = Math.pow(2, retries) * 1000;
          setTimeout(() => fetchWithRetry(retries + 1), delay);
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `❌ ระบบขัดข้อง: ${err.message}. รบกวนพี่ๆ เช็คอินเทอร์เน็ต หรือกดปุ่มรีเฟรชฐานข้อมูลที่แถบด้านซ้ายนะครับ` 
          }]);
        }
      } finally {
        setIsGenerating(false);
      }
    };

    fetchWithRetry();
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Drawer) */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-[#0d0d0f] border-r border-amber-900/20 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl`}>
        <div className="p-6 border-b border-amber-900/10 flex items-center justify-between bg-gradient-to-br from-[#0d0d0f] to-amber-900/10">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
              <Factory size={24} className="text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight uppercase leading-none">Domae Auto</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter mt-1 leading-tight">Thermal Welding Machine</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-5 flex-1 space-y-6 overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1 flex items-center gap-2">
              <Settings size={12} /> System Status
            </p>
            <div className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${syncStatus === 'success' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-900/50 border-slate-800'}`}>
              <div className="relative flex items-center justify-center h-3 w-3">
                {syncStatus === 'loading' && <span className="animate-ping absolute h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                <span className={`relative rounded-full h-2 w-2 ${
                  syncStatus === 'success' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 
                  syncStatus === 'loading' ? 'bg-yellow-500' : 'bg-rose-500'
                }`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-300">Database Sync</p>
                <p className="text-[10px] text-slate-500 truncate">{syncStatus === 'success' ? 'Online & Synced' : 'Offline Mode'}</p>
              </div>
              <button onClick={fetchKnowledge} disabled={syncStatus === 'loading'} className="p-1.5 hover:bg-slate-800 rounded-lg text-amber-500 transition-colors">
                <RefreshCcw size={14} className={syncStatus === 'loading' ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-amber-900/10 bg-black/30 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em]">DEV BY RATTANACHOT S.</p>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full bg-[#080809] relative w-full">
        
        {/* Navigation Header */}
        <header className="h-16 bg-[#0c0c0e]/90 backdrop-blur-xl border-b border-slate-800/50 flex items-center px-4 md:px-8 justify-between shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:bg-zinc-800 rounded-xl transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <Zap size={18} className="text-amber-500 hidden sm:block" />
              <h2 className="text-xs md:text-sm font-bold text-slate-100 uppercase tracking-tight">
                Technical Knowledge <span className="text-slate-600 mx-1">|</span> <span className="text-amber-500 uppercase">Auto Thermal Welding machine</span>
              </h2>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-800 bg-zinc-900">
             <ShieldCheck size={14} className="text-emerald-500" />
             <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Secure Portal</span>
          </div>
        </header>

        {/* Chat History View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 no-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 md:gap-5 max-w-4xl mx-auto ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              
              {/* Avatar Icon */}
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl ${
                m.role === 'user' ? 'bg-zinc-800 border border-slate-700 text-slate-400' : 'bg-amber-600 text-zinc-950'
              }`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={24} />}
              </div>

              {/* Chat Bubble Area */}
              <div className={`max-w-[85%] md:max-w-[75%] p-4 md:p-6 rounded-3xl shadow-lg leading-relaxed text-sm md:text-base ${
                m.role === 'user' 
                  ? 'bg-amber-600/10 border border-amber-500/20 text-slate-100 rounded-tr-none' 
                  : 'bg-[#121214] border border-slate-800 text-slate-200 rounded-tl-none border-l-4 border-l-amber-600'
              }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className={`text-[10px] mt-3 font-bold ${m.role === 'user' ? 'text-amber-500/40 text-right' : 'text-slate-600'}`}>
                   {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isGenerating && (
            <div className="flex gap-5 max-w-4xl mx-auto">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Bot size={24} className="animate-pulse" />
              </div>
              <div className="bg-[#121214] border border-slate-800 p-5 rounded-3xl rounded-tl-none border-l-4 border-l-amber-600 shadow-xl flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Controls Area */}
        <footer className="p-4 md:p-10 bg-gradient-to-t from-[#050505] to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Quick Link Button */}
            <div className="flex">
              <button 
                onClick={() => handleSubmit(null, "Standard parameter")}
                disabled={isGenerating || syncStatus !== 'success'}
                className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-5 py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-30 active:scale-95 shadow-md"
              >
                <Flame size={14} /> Standard parameter
              </button>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={(e) => handleSubmit(e)} className="relative group">
              <div className="absolute -inset-1 bg-amber-500/10 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative bg-[#121214] border border-slate-800 p-1.5 md:p-2 rounded-[2rem] flex items-end gap-2 shadow-2xl transition-all focus-within:border-amber-500/50">
                
                <div className="p-3 text-slate-600 mb-0.5 ml-1 hidden sm:block">
                  <Info size={20} />
                </div>

                <textarea 
                  value={inputText} 
                  onChange={(e)=>setInputText(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  rows="1"
                  className="flex-1 bg-transparent border-none p-4 focus:ring-0 resize-none max-h-32 text-sm md:text-base text-slate-200 placeholder:text-slate-600 no-scrollbar" 
                  placeholder="พิมพ์ถามปัญหา หรือเช็คพารามิเตอร์..." 
                />
                
                <button 
                  type="submit"
                  disabled={isGenerating || !inputText.trim()} 
                  className="bg-amber-600 text-zinc-950 p-4 rounded-2xl hover:bg-amber-500 disabled:opacity-20 disabled:grayscale transition-all active:scale-90 shadow-lg mb-1 mr-1 flex items-center justify-center shrink-0"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
            
            {/* Branding Footer */}
            <div className="flex justify-center">
              <p className="text-[9px] text-slate-700 font-bold tracking-[0.4em] flex items-center gap-2">
                  <span>TECHNICAL SUPPORT PORTAL</span>
                  <span className="w-1 h-1 bg-amber-800 rounded-full"></span>
                  <span>BY RATTANACHOT S.</span>
              </p>
            </div>
          </div>
        </footer>

      </main>

      {/* Embedded CSS Utilities */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default App;
