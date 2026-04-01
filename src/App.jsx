import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Menu, X, Factory, Bot, ShieldCheck, RefreshCcw, Zap, User, Settings, Flame, Info 
} from 'lucide-react';

const App = () => {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'สวัสดีครับพี่ๆ ทีมงาน! ผู้ช่วย Domae Auto Thermal Welding Machine พร้อมลุยครับ มีปัญหาหน้างาน พิมพ์ถามได้เลยครับ! 🏭🔥' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sheetKnowledge, setSheetKnowledge] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const messagesEndRef = useRef(null);

  // --- CONFIGURATION ---
  // แก้ไขปัญหาเป๊ะๆ: ใช้ชื่อโมเดลรุ่นล่าสุดและจัดการ Key ผ่านระบบที่รองรับ
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
  const sheetDB_URL = "https://sheetdb.io/api/v1/dg3h9mlyf4s6q"; 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      }
    } catch (err) {
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSubmit = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const textToSend = quickText || inputText;
    if (!textToSend.trim() || isGenerating) return;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setInputText('');
    setIsGenerating(true);

    try {
      // 💡 PROMPT แบบสั้นกระชับ (แก้ไขให้ถูก Syntax แล้ว ไม่ Error แน่นอน)
      const systemPrompt = `คุณคือ "คู่มือดิจิทัล" สำหรับเครื่อง MCB Auto Weld Thermal พัฒนาโดย Rattanachot S.
      จงตอบคำถามโดยใช้ฐานความรู้นี้เท่านั้น:
      ---
      ${sheetKnowledge || "ยังไม่มีข้อมูลในระบบ"}
      ---
      กฎเหล็กในการตอบ:
      1. ตอบให้กระชับที่สุด (Short & Concise) ห้ามเกริ่นนำยาวๆ
      2. เน้น "ตัวเลขพารามิเตอร์" และ "วิธีแก้ปัญหา" เป็นหลัก
      3. ต้องตอบเป็นข้อๆ (Bullet points) ให้อ่านง่ายบนมือถือ
      4. เรียกผู้ใช้ว่า "พี่ช่าง"
      5. หากไม่มีข้อมูล ให้ตอบว่า "ขออภัยครับพี่ช่าง ข้อมูลนี้ยังไม่มีในระบบ รบกวนติดต่อคุณบอล (Rattanachot S.) โดยตรงครับ"`;

      // อัปเดต Model เป็น Gemini 3.1 Flash Lite Preview ตามที่พี่บอลสั่ง
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: textToSend }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      const result = await response.json();
      const botResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (botResponse) {
        setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
      } else {
        throw new Error(result?.error?.message || "Empty Response");
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ ระบบหลังบ้านแจ้งว่า: ${err.message}. รบกวนพี่บอลเช็ค API Key หรือการตั้งค่าหลังบ้านนะครับ` 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden">
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-[#0d0d0f] border-r border-amber-900/20 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 z-50 flex flex-col`}>
        <div className="p-6 border-b border-amber-900/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2 rounded-lg text-black"><Factory size={20} /></div>
            <div>
              <h1 className="text-xs font-bold text-white uppercase leading-none">Domae Auto</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">Thermal Welding</p>
            </div>
          </div>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          <div className={`flex items-center space-x-3 p-3 rounded-xl border ${syncStatus === 'success' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className={`h-2 w-2 rounded-full ${syncStatus === 'success' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            <p className="text-xs font-semibold">{syncStatus === 'success' ? 'Database Online' : 'Sync Error'}</p>
            <button onClick={fetchKnowledge} className="ml-auto text-amber-500"><RefreshCcw size={14} /></button>
          </div>
        </div>
        <div className="p-4 border-t border-amber-900/10 text-[9px] text-center text-slate-600 font-bold tracking-widest uppercase">Dev by Rattanachot S.</div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#080809]">
        <header className="h-14 bg-[#0c0c0e] border-b border-slate-800 flex items-center px-4 justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-400"><Menu size={20} /></button>
          <div className="flex items-center space-x-2">
            <Zap size={16} className="text-amber-500" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Auto Thermal Welding Assistant</h2>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-zinc-900 px-3 py-1 rounded-full border border-slate-800">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-500">SECURE PORTAL</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 max-w-4xl mx-auto ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.role === 'user' ? 'bg-zinc-800' : 'bg-amber-600 text-black'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-amber-600/10 border border-amber-500/20 text-slate-100' : 'bg-[#121214] border border-slate-800 text-slate-200 border-l-4 border-l-amber-600'}`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 md:p-8 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            <button onClick={() => handleSubmit(null, "Standard parameter")} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-full text-[10px] font-bold hover:bg-amber-500/20 transition-all">Standard parameter</button>
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-[#121214] border border-slate-800 p-2 rounded-2xl focus-within:border-amber-500/50">
              <textarea 
                value={inputText} onChange={(e)=>setInputText(e.target.value)} 
                onKeyDown={(e) => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                rows="1" className="flex-1 bg-transparent border-none p-2 focus:ring-0 text-sm text-slate-200 no-scrollbar resize-none" placeholder="ถามปัญหาหน้างาน..." 
              />
              <button type="submit" disabled={isGenerating || !inputText.trim()} className="bg-amber-600 text-black p-3 rounded-xl hover:bg-amber-500 disabled:opacity-20 shadow-lg shrink-0"><Send size={18} /></button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
