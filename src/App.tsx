/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { Finances } from './components/Finances';
import { Vehicle } from './components/Vehicle';
import { Logbook } from './components/Logbook';
import { Calculator } from './components/Calculator';
import { AICopilot } from './components/AICopilot';
import { Paywall } from './components/Paywall';
import { LayoutDashboard, Wallet, Car, BookOpen, Bot, LogOut, Calculator as CalcIcon } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { Button } from './components/ui/button';

type Tab = 'dashboard' | 'finances' | 'vehicle' | 'logbook' | 'calculator' | 'copilot';

function LoginScreen() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-50">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <Car className="h-12 w-12 text-emerald-500" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DriverMetrics</h1>
          <p className="text-zinc-400 mt-2">Gestão inteligente para motoristas de aplicativo.</p>
        </div>
        <Button onClick={handleLogin} className="w-full h-12 text-lg bg-white text-zinc-950 hover:bg-zinc-200">
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}

function MainLayout() {
  const { user, userData, isAuthReady } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    // Check for payment success in URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    if (params.get('payment') === 'success' && sessionId && user) {
      // Clear URL
      window.history.replaceState({}, document.title, '/');
      
      // Verify session and update user
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(async data => {
          if (data.status === 'complete' || data.status === 'paid') {
            // Update user document in Firestore
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('./firebase');
            await setDoc(doc(db, 'users', user.uid), {
              subscriptionStatus: 'active'
            }, { merge: true });
            
            alert('Pagamento confirmado! Bem-vindo ao DriverMetrics Premium.');
            // Reload to get new user data
            window.location.reload();
          }
        })
        .catch(err => console.error('Error verifying session:', err));
    }
  }, [user]);

  useEffect(() => {
    const handleOpenFinances = () => setActiveTab('finances');
    
    window.addEventListener('open-add-ride', handleOpenFinances);
    window.addEventListener('open-add-expense', handleOpenFinances);
    
    return () => {
      window.removeEventListener('open-add-ride', handleOpenFinances);
      window.removeEventListener('open-add-expense', handleOpenFinances);
    };
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-50">Carregando...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Check subscription status
  const isAdmin = user.email === 'reisanselmo7@gmail.com';
  const hasActiveSubscription = userData?.subscriptionStatus === 'active';
  
  if (!isAdmin && !hasActiveSubscription) {
    return <Paywall />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'finances': return <Finances />;
      case 'vehicle': return <Vehicle />;
      case 'logbook': return <Logbook />;
      case 'calculator': return <Calculator />;
      case 'copilot': return <AICopilot />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="container flex h-14 items-center justify-between px-4 max-w-md mx-auto">
          <div className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-lg tracking-tight">DriverMetrics</span>
          </div>
          <button onClick={() => signOut(auth)} className="text-zinc-400 hover:text-zinc-100 p-2">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 pt-6 pb-24 max-w-md mx-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 pb-safe">
        <div className="flex h-16 items-center justify-around px-2 max-w-md mx-auto">
          <NavItem icon={<LayoutDashboard />} label="Início" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wallet />} label="Finanças" isActive={activeTab === 'finances'} onClick={() => setActiveTab('finances')} />
          <NavItem icon={<CalcIcon />} label="Calculadora" isActive={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} />
          <NavItem icon={<Car />} label="Veículo" isActive={activeTab === 'vehicle'} onClick={() => setActiveTab('vehicle')} />
          <NavItem icon={<BookOpen />} label="Diário" isActive={activeTab === 'logbook'} onClick={() => setActiveTab('logbook')} />
          <NavItem icon={<Bot />} label="Copilot" isActive={activeTab === 'copilot'} onClick={() => setActiveTab('copilot')} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
        isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <div className={`[&>svg]:w-6 [&>svg]:h-6 ${isActive ? '[&>svg]:fill-emerald-500/20' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
