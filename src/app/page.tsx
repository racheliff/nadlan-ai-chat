'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🏠 נדל״ן AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            חפש עסקאות נדל״ן, נתח מגמות שוק, והשווה מחירים
          </p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏡</div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ברוכים הבאים!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                שאל אותי על עסקאות נדל״ן בכל כתובת בישראל
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'מה המחירים בבילו 4 בת ים?',
                  'עסקאות אחרונות ברוטשילד תל אביב',
                  'השווה מחירים בין חולון לבת ים',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      const fakeEvent = {
                        target: { value: suggestion },
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(fakeEvent);
                    }}
                    className="px-4 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md border border-gray-100 dark:border-gray-600'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-md border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-bounce">●</div>
                    <div className="animate-bounce delay-100">●</div>
                    <div className="animate-bounce delay-200">●</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="שאל על נדל״ן בישראל..."
              className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 font-medium transition-colors"
            >
              שלח
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
