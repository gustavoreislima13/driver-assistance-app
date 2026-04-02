import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { UserData } from '../types';
import { CheckCircle, XCircle, Users, Search } from 'lucide-react';
import { Input } from './ui/input';

interface AdminUser extends UserData {
  id: string;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSubscription = async (userId: string, currentStatus?: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: newStatus
      });
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, subscriptionStatus: newStatus } : u));
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Erro ao atualizar o status do usuário.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>
        <Users className="w-6 h-6 text-emerald-500" />
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Ative ou revogue o acesso dos motoristas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-9 bg-zinc-950 border-zinc-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-zinc-500">Carregando usuários...</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-100">{user.name}</p>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="flex items-center">
                      {user.subscriptionStatus === 'active' ? (
                        <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                          <XCircle className="w-3 h-3 mr-1" /> Inativo
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      variant={user.subscriptionStatus === 'active' ? 'destructive' : 'default'}
                      size="sm"
                      className={user.subscriptionStatus !== 'active' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => toggleSubscription(user.id, user.subscriptionStatus)}
                    >
                      {user.subscriptionStatus === 'active' ? 'Revogar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-zinc-500">Nenhum usuário encontrado.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
