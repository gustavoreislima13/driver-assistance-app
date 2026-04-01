import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export const AICopilot = () => {
  const { rides, expenses, vehicle, fixedExpenses } = useAppContext();
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Olá! Sou seu Copiloto Financeiro. Analisei seus dados recentes. Como posso ajudar a melhorar seus ganhos hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare context
      const context = `
        Você é um consultor financeiro especialista para motoristas de aplicativo (Uber, 99, inDrive).
        Responda de forma concisa, direta e amigável.
        
        Dados atuais do motorista:
        Veículo: ${vehicle.make} ${vehicle.model} ${vehicle.year} (Motor ${vehicle.engine}, KM: ${vehicle.currentKm})
        Consumo ideal: ${vehicle.idealConsumptionKmL} km/l
        
        Despesas Fixas:
        Seguro: R$${fixedExpenses.insurance}/mês
        IPVA: R$${fixedExpenses.ipva}/ano
        Internet: R$${fixedExpenses.internet}/mês
        Reserva Manutenção: R$${fixedExpenses.maintenanceReservePerKm}/km
        
        Resumo de Corridas (Total: ${rides.length}):
        Ganhos Totais: R$${rides.reduce((sum, r) => sum + r.earnings, 0).toFixed(2)}
        KM Total Rodado: ${rides.reduce((sum, r) => sum + r.distanceKm, 0).toFixed(1)} km
        
        Resumo de Despesas (Total: ${expenses.length}):
        Gasto Total: R$${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
        Gasto com Combustível: R$${expenses.filter(e => e.category === 'Combustível').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nPergunta do motorista: ${userMessage}`,
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Desculpe, não consegui processar sua solicitação.' }]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Ocorreu um erro ao conectar com a IA. Verifique sua chave de API ou tente novamente mais tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-20">
      <h1 className="text-2xl font-bold tracking-tight mb-4 shrink-0">AI Copilot</h1>
      
      <Card className="flex-1 bg-zinc-900/50 border-zinc-800 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 ml-2' : 'bg-emerald-600 mr-2'}`}>
                  {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] flex-row">
                <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-emerald-600 mr-2">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="p-3 rounded-2xl text-sm bg-zinc-800 text-zinc-200 rounded-tl-none flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Analisando dados...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
          <form onSubmit={handleSend} className="flex space-x-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Pergunte sobre seus ganhos, custos ou manutenção..." 
              className="flex-1 bg-zinc-900 border-zinc-700"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
