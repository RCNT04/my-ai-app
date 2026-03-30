import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'ยินดีต้อนรับสู่ บอล Chatbot ถามวัวตอบควาย 555+!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState(''); // เก็บข้อมูลจากไฟล์ที่อัปโหลด
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('Thai'); // ช่องเปลี่ยนภาษา

  const messagesEndRef = useRef(null);

  // 🚨 ดึงรหัสจาก Vercel Environment Variables (ที่เราตั้งค่าไว้ VITE_GEMINI_API_KEY)
  const myKey = import.meta.env.VITE_GEMINI_API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // ฟังก์ชันอ่านไฟล์ที่อัปโหลด
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setKnowledgeBase(event.target.result);
      alert('บันทึกข้อมูลเข้าฐานความรู้เรียบร้อย! ถามจากไฟล์ได้เลยครับ');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);
    setError(null);

    try {
      // 🚀 ใช้รุ่น 3.1 ตามที่คุณบอลเจอมาล่าสุด!
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${myKey}`;
      
      const prompt = knowledgeBase 
        ? `ข้อมูลอ้างอิง: ${knowledgeBase}\n\nกรุณาตอบเป็นภาษา: ${language}\nคำถาม: ${inputText}`
        : `กรุณาตอบเป็นภาษา: ${language}\nคำถาม: ${inputText}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'เชื่อมต่อไม่ได้');

      const botResponse = data.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-black">
      {/* Header พร้อมช่องเลือกภาษาและอัปโหลดไฟล์ */}
      <header className="bg-white shadow p-4 flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-xl font-bold text-blue-600">SmartDoc AI 3.1 🤖</h1>
        
        <div className="flex items-center space-x-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-white"
          >
            <option value="Thai">ภาษาไทย</option>
            <option value="English">English</option>
          </select>

          <div className="flex items-center space-x-2 border-l pl-4">
            <span className="text-xs text-gray-500">อัปโหลดไฟล์ (.txt):</span>
            <input type="file" onChange={handleFileUpload} className="text-xs" />
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isGenerating && <div className="text-center text-blue-400 text-xs animate-pulse italic">Gemini 3.1 กำลังวิเคราะห์...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">{error}</div>}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Footer */}
      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={knowledgeBase ? "ถามเกี่ยวกับไฟล์ที่อัปโหลด..." : "ถามอะไรก็ได้..."}
            className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button type="submit" disabled={isGenerating} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
            ส่ง
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
