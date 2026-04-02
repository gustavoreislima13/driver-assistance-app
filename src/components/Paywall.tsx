import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Lock } from 'lucide-react';
import { auth } from '../firebase';

export const Paywall = () => {
  const mpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Mercado Pago script
    if (mpRef.current && mpRef.current.children.length === 0) {
      const script = document.createElement('script');
      script.src = 'https://www.mercadopago.com.br/integrations/v1/web-payment-checkout.js';
      script.setAttribute('data-preference-id', '1823267654-acdffc56-1c88-4141-b3ae-13998e82581e');
      script.setAttribute('data-source', 'button');
      mpRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Premium</CardTitle>
          <CardDescription className="text-zinc-400">
            Desbloqueie todas as funcionalidades do sistema de gestão para motoristas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {[
              'Calculadora de Corridas Particular',
              'Gestão de Despesas e Ganhos',
              'Controle de Manutenção',
              'Relatórios Detalhados',
            ].map((feature, i) => (
              <div key={i} className="flex items-center text-sm text-zinc-300">
                <CheckCircle className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-white">R$ 1,50</span>
              <span className="text-zinc-400 text-sm"> / único</span>
            </div>
            
            {/* Mercado Pago Button Container */}
            <div className="flex justify-center min-h-[48px] mb-4" ref={mpRef}></div>
            
            <p className="text-xs text-center text-zinc-500 mb-4">
              Após o pagamento, o acesso será liberado pelo administrador.
            </p>

            <Button 
              variant="ghost" 
              className="w-full text-zinc-400 hover:text-white"
              onClick={() => auth.signOut()}
            >
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
