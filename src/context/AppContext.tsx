import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, Ride, Expense, Vehicle, MaintenanceAlert, FixedExpenses, UserData } from '../types';
import { initialData } from '../mockData';
import { db, auth } from '../firebase';
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { formatISO } from 'date-fns';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppContextType extends AppState {
  user: User | null;
  userData: UserData | null;
  isAuthReady: boolean;
  addRide: (ride: Omit<Ride, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateRide: (id: string, ride: Partial<Omit<Ride, 'id'>>) => Promise<void>;
  deleteRide: (id: string) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  updateFixedExpenses: (expenses: FixedExpenses) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [state, setState] = useState<AppState>({
    rides: [],
    expenses: [],
    vehicle: initialData.vehicle,
    maintenanceAlerts: initialData.maintenanceAlerts,
    fixedExpenses: initialData.fixedExpenses,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const userId = user.uid;

    // Ensure user document exists and listen to it
    const userRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      } else {
        const newUserData = {
          email: user.email || '',
          name: user.displayName || 'Driver',
          createdAt: formatISO(new Date())
        };
        setDoc(userRef, newUserData).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
        setUserData(newUserData);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}`));

    // Rides
    const ridesRef = collection(db, 'users', userId, 'rides');
    const qRides = query(ridesRef, orderBy('date', 'desc'));
    const unsubRides = onSnapshot(qRides, (snapshot) => {
      const ridesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
      setState(prev => ({ ...prev, rides: ridesData }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/rides`));

    // Expenses
    const expensesRef = collection(db, 'users', userId, 'expenses');
    const qExpenses = query(expensesRef, orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setState(prev => ({ ...prev, expenses: expensesData }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/expenses`));

    // Vehicle
    const vehicleRef = doc(db, 'users', userId, 'vehicle', 'info');
    const unsubVehicle = onSnapshot(vehicleRef, (docSnap) => {
      if (docSnap.exists()) {
        setState(prev => ({ ...prev, vehicle: docSnap.data() as Vehicle }));
      } else {
        // Initialize with mock data if not exists
        setDoc(vehicleRef, { ...initialData.vehicle, updatedAt: formatISO(new Date()) })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}/vehicle/info`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/vehicle/info`));

    // Fixed Expenses
    const fixedExpRef = doc(db, 'users', userId, 'fixedExpenses', 'info');
    const unsubFixedExp = onSnapshot(fixedExpRef, (docSnap) => {
      if (docSnap.exists()) {
        setState(prev => ({ ...prev, fixedExpenses: docSnap.data() as FixedExpenses }));
      } else {
        setDoc(fixedExpRef, { ...initialData.fixedExpenses, updatedAt: formatISO(new Date()) })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}/fixedExpenses/info`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}/fixedExpenses/info`));

    // Maintenance Alerts
    const alertsRef = collection(db, 'users', userId, 'maintenanceAlerts');
    const unsubAlerts = onSnapshot(alertsRef, (snapshot) => {
      if (!snapshot.empty) {
        const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceAlert));
        setState(prev => ({ ...prev, maintenanceAlerts: alertsData }));
      } else {
        // Initialize mock alerts
        initialData.maintenanceAlerts.forEach(alert => {
          const { id, ...rest } = alert;
          addDoc(alertsRef, { ...rest, createdAt: formatISO(new Date()) })
            .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${userId}/maintenanceAlerts`));
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/maintenanceAlerts`));

    return () => {
      unsubUser();
      unsubRides();
      unsubExpenses();
      unsubVehicle();
      unsubFixedExp();
      unsubAlerts();
    };
  }, [user, isAuthReady]);

  const addRide = async (ride: Omit<Ride, 'id'>) => {
    if (!user) return;
    try {
      const ridesRef = collection(db, 'users', user.uid, 'rides');
      await addDoc(ridesRef, { ...ride, createdAt: formatISO(new Date()) });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/rides`);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    try {
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      await addDoc(expensesRef, { ...expense, createdAt: formatISO(new Date()) });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/expenses`);
    }
  };

  const updateRide = async (id: string, ride: Partial<Omit<Ride, 'id'>>) => {
    if (!user) return;
    try {
      const rideRef = doc(db, 'users', user.uid, 'rides', id);
      await updateDoc(rideRef, ride);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/rides/${id}`);
    }
  };

  const deleteRide = async (id: string) => {
    if (!user) return;
    try {
      const rideRef = doc(db, 'users', user.uid, 'rides', id);
      await deleteDoc(rideRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/rides/${id}`);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id'>>) => {
    if (!user) return;
    try {
      const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
      await updateDoc(expenseRef, expense);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
      await deleteDoc(expenseRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/expenses/${id}`);
    }
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    if (!user) return;
    try {
      const vehicleRef = doc(db, 'users', user.uid, 'vehicle', 'info');
      await setDoc(vehicleRef, { ...vehicle, updatedAt: formatISO(new Date()) }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/vehicle/info`);
    }
  };

  const updateFixedExpenses = async (fixedExpenses: FixedExpenses) => {
    if (!user) return;
    try {
      const fixedExpRef = doc(db, 'users', user.uid, 'fixedExpenses', 'info');
      await setDoc(fixedExpRef, { ...fixedExpenses, updatedAt: formatISO(new Date()) }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/fixedExpenses/info`);
    }
  };

  return (
    <AppContext.Provider value={{ ...state, user, userData, isAuthReady, addRide, addExpense, updateRide, deleteRide, updateExpense, deleteExpense, updateVehicle, updateFixedExpenses }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
