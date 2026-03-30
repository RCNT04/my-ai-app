import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'สวัสดีครับเพื่อนบอล! ผมกลับมาแล้ว รอบนี้ต้องได้คุยกันแน่นอน!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // 🚨 1. ใส่ API Key ใหม่ซิงๆ ของคุณบอลในฟันหนูนี้ (ห้ามมีช่องว่าง ห้ามมี ;)
  const myKey="AIzaSyDXwSslQS5k6rXe0KNMQoelACPlhfkeekI";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);
    setError(null);

    try {
      // 🚨 2. ใช้ URL แบบมาตรฐานที่สุด (ตัด models/ ออกเพื่อความชัวร์ในบาง Region)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${myKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: inputText }]
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // ให้บอทฟ้อง Error จริงๆ จาก Google ออกมาเลยจะได้แก้ถูกจุด
        throw new Error(`Google บอกว่า: ${data.error?.message || 'เชื่อมต่อไม่ได้'}`);
      }

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
      <header className="bg-white shadow p-4 text-center">
        <h1 className="text-xl font-bold text-blue-600">SmartDoc AI 🤖</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm border border-gray-100'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isGenerating && <div className="text-center text-blue-500 animate-pulse text-sm">กำลังคิด...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">{error}</div>}
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="พิมพ์ทักทายผมหน่อย..."
            className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button type="submit" disabled={isGenerating} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50">ส่ง</button>
        </form>
      </footer>
    </div>
  );
};

export default App;
