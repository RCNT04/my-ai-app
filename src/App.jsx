import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'สวัสดีครับเพื่อน! ผมบอท SmartDoc AI พร้อมช่วยวิเคราะห์ข้อมูลและตอบคำถามแล้วครับ' }
  ]);
  const [inputText, setInputText] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState(''); // เก็บข้อมูลจากไฟล์ที่อัปโหลด
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // 🚨 🚨 เอา API KEY ใหม่ที่ก๊อปมา วางแทนที่รหัสข้างล่างนี้เป๊ะๆ เลยครับ 🚨 🚨
  const apiKey = "AIzaSyALw-UizoyFLREegE_I6BaUgXNIYhF41DM";

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
      alert('อัปโหลดข้อมูลสำเร็จ! ตอนนี้บอทพร้อมตอบคำถามจากไฟล์นี้แล้วครับ');
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
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyCG4QwAa1JSkT78XYVmI4fHdLiP0y8PUdI`;
      
      // รวมคำถามของผู้ใช้ เข้ากับข้อมูลจากไฟล์ (ถ้ามี)
      const prompt = knowledgeBase 
        ? `ข้อมูลอ้างอิง: ${knowledgeBase}\n\nคำถาม: ${inputText}`
        : inputText;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Error: ${errorData.error?.message || 'API Key มีปัญหา'}`);
      }

      const data = await response.json();
      const botResponse = data.candidates[0].content.parts[0].text;
      
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">SmartDoc AI 🤖</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">อัปโหลดไฟล์เสริมความรู้:</span>
          <input type="file" onChange={handleFileUpload} className="text-sm border rounded p-1" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isGenerating && <div className="text-blue-500 animate-bounce text-center text-sm">บอทกำลังประมวลผล...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">{error}</div>}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex space-x-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={knowledgeBase ? "ถามเกี่ยวกับไฟล์ที่อัปโหลด..." : "พิมพ์ข้อความทักทาย..."}
            className="flex-1 border border-gray-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black shadow-sm"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
          >
            ส่ง
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
