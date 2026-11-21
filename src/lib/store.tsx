'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Company,
  User,
  Vehicle,
  Route,
  Trip,
  Booking,
  Passenger,
  FinanceAccount,
  Transaction,
  Role,
  Incident,
  BoardingStatus,
  PassengerRequest,
  RequestStatus,
} from '@/types';
import {
  INITIAL_COMPANY,
  INITIAL_USERS,
  INITIAL_VEHICLES,
  INITIAL_ROUTES,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_PASSENGERS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_REQUESTS,
} from './mockData';

interface AppContextType {
  company: Company;
  currentUser: User;
  users: User[];
  vehicles: Vehicle[];
  routes: Route[];
  trips: Trip[];
  bookings: Booking[];
  requests: PassengerRequest[];
  passengers: Passenger[];
  accounts: FinanceAccount[];
  transactions: Transaction[];
  getAccountBalance: (accountId: string) => number;
  switchUserRole: (role: Role) => void;
  assignVehicleAndDriver: (tripId: string, vehicleId: string, driverId: string) => void;
  createRequest: (params: {
    passengerName: string;
    phone: string;
    fromCity: string;
    toCity: string;
    desiredDate: string;
    desiredTime?: string;
    seatsCount: number;
    type?: 'passenger' | 'parcel';
    parcelDescription?: string;
    priceEstimate?: number;
    currency?: 'RUB' | 'KZT' | 'BYN';
    notes?: string;
    source?: 'telegram' | 'website' | 'phone' | 'dispatcher';
  }) => string;
  assignRequestToTrip: (requestId: string, tripId: string, seatNumber?: number) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  deleteRequest: (requestId: string) => void;
  createBookingWithPayment: (params: {
    tripId: string;
    fullName: string;
    phone: string;
    documentNumber?: string;
    seatNumber: number;
    fromStop: string;
    toStop: string;
    price: number;
    currency: 'RUB' | 'KZT' | 'BYN';
    payNow: boolean;
    accountId?: string;
  }) => { bookingId: string; passengerId: string };
  markBookingPaid: (bookingId: string, accountId: string, paymentMethod: string) => void;
  collectCashByDriver: (bookingId: string) => void;
  setPassengerBoarding: (bookingId: string, status: BoardingStatus) => void;
  addIncident: (vehicleId: string, description: string, reportedBy?: string) => void;
  resolveIncident: (vehicleId: string, incidentId: string) => void;
  toggleEquipmentItem: (vehicleId: string, equipmentId: string) => void;
  approveTransaction: (transactionId: string) => void;
  rejectTransaction: (transactionId: string) => void;
  addExpenseRequest: (params: {
    accountId: string;
    category: 'fuel' | 'repair' | 'salary' | 'fine' | 'other';
    categoryLabel: string;
    amount: number;
    currency: string;
    description: string;
    vehicleId?: string;
    tripId?: string;
    supplierName?: string;
    invoiceNumber?: string;
    liters?: number;
    receiptAttachment?: any;
  }) => void;
  addVehicleDocument: (vehicleId: string, doc: any) => void;
  addVehicleServiceRecord: (vehicleId: string, srv: any) => void;
  toggleCheckpoint: (tripId: string, stopId: string) => void;
  executeAIPrompt: (prompt: string) => { success: boolean; message: string; action?: string };
  resetToDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'bumerang_demo_state_v4';

function calculateAccountBalance(transactions: Transaction[], accountId: string) {
  return transactions
    .filter((transaction) => transaction.accountId === accountId && transaction.status === 'confirmed')
    .reduce(
      (balance, transaction) =>
        balance + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
      0
    );
}

function migrateFinanceData(savedAccounts: unknown, savedTransactions: unknown) {
  type LegacyFinanceAccount = FinanceAccount & { balance?: number };
  const accounts: LegacyFinanceAccount[] = Array.isArray(savedAccounts)
    ? (savedAccounts as LegacyFinanceAccount[])
    : INITIAL_ACCOUNTS;
  const transactions = Array.isArray(savedTransactions)
    ? (savedTransactions as Transaction[])
    : INITIAL_TRANSACTIONS;
  const migratedTransactions = [...transactions];
  const defaultAccountNames = new Map(INITIAL_ACCOUNTS.map((account) => [account.id, account.name]));

  const normalizedAccounts = accounts.map((account) => {
    const openingTransactionId = `opening_${account.id}`;
    if (
      typeof account.balance === 'number' &&
      !migratedTransactions.some((transaction) => transaction.id === openingTransactionId)
    ) {
      const openingBalance = account.balance - calculateAccountBalance(migratedTransactions, account.id);
      if (openingBalance !== 0) {
        migratedTransactions.push({
          id: openingTransactionId,
          accountId: account.id,
          type: openingBalance > 0 ? 'income' : 'expense',
          category: 'other',
          categoryLabel: 'Начальный остаток',
          amount: Math.abs(openingBalance),
          currency: account.currency,
          status: 'confirmed',
          date: 'Начало учёта',
          description: 'Остаток на счёте при подключении к системе',
          createdBy: 'Система',
          isOpeningBalance: true,
        });
      }
    }

    return {
      id: account.id,
      name: defaultAccountNames.get(account.id) || account.name,
      currency: account.currency,
    };
  });

  return { accounts: normalizedAccounts, transactions: migratedTransactions };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [company, setCompany] = useState<Company>(INITIAL_COMPANY);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]); // Default: 'Дмитрий Орлов (Логист)'
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [requests, setRequests] = useState<PassengerRequest[]>(INITIAL_REQUESTS);
  const [passengers, setPassengers] = useState<Passenger[]>(INITIAL_PASSENGERS);
  const [accounts, setAccounts] = useState<FinanceAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  const getAccountBalance = (accountId: string) =>
    calculateAccountBalance(transactions, accountId);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      if (saved) {
        if (parsed.company) setCompany(parsed.company);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (parsed.vehicles && Array.isArray(parsed.vehicles)) {
          setVehicles(
            parsed.vehicles.map((v: any) => {
              const defaultV = INITIAL_VEHICLES.find((iv) => iv.id === v.id);
              return {
                ...v,
                documents: v.documents?.length ? v.documents : defaultV?.documents || [],
                serviceRecords: v.serviceRecords?.length ? v.serviceRecords : defaultV?.serviceRecords || [],
                equipment: v.equipment?.length ? v.equipment : defaultV?.equipment || [],
                incidents: v.incidents || [],
                photos: v.photos?.length ? v.photos : defaultV?.photos || [],
                baseCity: v.baseCity || defaultV?.baseCity,
                garageNumber: v.garageNumber || defaultV?.garageNumber,
                assignedDriverName: v.assignedDriverName || defaultV?.assignedDriverName,
              };
            })
          );
        }
        if (parsed.routes) setRoutes(parsed.routes);
        if (parsed.trips) setTrips(parsed.trips);
        if (parsed.bookings) setBookings(parsed.bookings);
        if (Array.isArray(parsed.requests)) setRequests(parsed.requests);
        if (Array.isArray(parsed.passengers)) {
          setPassengers(
            parsed.passengers.map((passenger: Passenger & { lostItems?: unknown }) => {
              const normalizedPassenger = { ...passenger };
              delete normalizedPassenger.lostItems;
              return normalizedPassenger;
            })
          );
        }
      }
      const financeData = migrateFinanceData(parsed.accounts, parsed.transactions);
      setAccounts(financeData.accounts);
      setTransactions(financeData.transactions);
    } catch (e) {
      console.warn('Could not read state from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const state = {
        company,
        users,
        currentUser,
        vehicles,
        routes,
        trips,
        bookings,
        requests,
        passengers,
        accounts,
        transactions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save state to localStorage', e);
    }
  }, [
    isLoaded,
    company,
    users,
    currentUser,
    vehicles,
    routes,
    trips,
    bookings,
    requests,
    passengers,
    accounts,
    transactions,
  ]);

  const switchUserRole = (role: Role) => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  const assignVehicleAndDriver = (tripId: string, vehicleId: string, driverId: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, vehicleId, driverId } : t))
    );
  };

  const createBookingWithPayment = ({
    tripId,
    fullName,
    phone,
    documentNumber,
    seatNumber,
    fromStop,
    toStop,
    price,
    currency,
    payNow,
    accountId,
  }: {
    tripId: string;
    fullName: string;
    phone: string;
    documentNumber?: string;
    seatNumber: number;
    fromStop: string;
    toStop: string;
    price: number;
    currency: 'RUB' | 'KZT' | 'BYN';
    payNow: boolean;
    accountId?: string;
  }) => {
    let existingPassenger = passengers.find(
      (p) => p.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')
    );
    let passengerId = existingPassenger?.id;

    if (!existingPassenger) {
      passengerId = `pass_${Date.now()}`;
      const newPassenger: Passenger = {
        id: passengerId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        documentNumber: documentNumber?.trim() || '',
        totalTrips: 1,
        notes: 'Добавлен через оператора рейса',
      };
      setPassengers((prev) => [newPassenger, ...prev]);
    } else {
      setPassengers((prev) =>
        prev.map((p) =>
          p.id === passengerId
            ? {
                ...p,
                totalTrips: p.totalTrips + 1,
                fullName: fullName.trim() || p.fullName,
                documentNumber: documentNumber?.trim() || p.documentNumber,
              }
            : p
        )
      );
    }

    const bookingId = `book_${Date.now()}`;
    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newBooking: Booking = {
      id: bookingId,
      tripId,
      passengerId: passengerId!,
      seatNumber,
      fromStop,
      toStop,
      price,
      currency,
      status: payNow ? 'paid' : 'confirmed',
      boardingStatus: 'waiting',
      createdAt: nowStr,
      paymentMethod: payNow ? 'Оплата при бронировании' : undefined,
      accountId: payNow ? accountId : undefined,
    };

    setBookings((prev) => [...prev, newBooking]);

    if (payNow && accountId) {
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        accountId,
        type: 'income',
        category: 'ticket_sale',
        categoryLabel: 'Оплата билета',
        amount: price,
        currency,
        status: 'confirmed',
        date: nowStr,
        description: `Оплата места №${seatNumber} (${fullName}), рейс #${tripId}`,
        createdBy: `${currentUser.name} (${currentUser.roleLabel})`,
        tripId,
        bookingId,
      };

      setTransactions((prev) => [newTx, ...prev]);
    }

    return { bookingId, passengerId: passengerId! };
  };

  const markBookingPaid = (bookingId: string, accountId: string, paymentMethod: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'paid', paymentMethod, accountId }
          : b
      )
    );

    const passenger = passengers.find((p) => p.id === booking.passengerId);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      accountId,
      type: 'income',
      category: 'ticket_sale',
      categoryLabel: `Оплата билета (${paymentMethod})`,
      amount: booking.price,
      currency: booking.currency,
      status: 'confirmed',
      date: nowStr,
      description: `Оплата места №${booking.seatNumber} (${passenger?.fullName || 'Пассажир'}), рейс #${booking.tripId}`,
      createdBy: `${currentUser.name} (${currentUser.roleLabel})`,
      tripId: booking.tripId,
      bookingId,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const collectCashByDriver = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const driverAccount = accounts.find((a) => a.id === 'acc_cash_driver') || accounts[1];
    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'paid',
              boardingStatus: 'boarded',
              paymentMethod: 'Наличные водителю на посадке',
              accountId: driverAccount.id,
              collectedByDriver: true,
            }
          : b
      )
    );

    const passenger = passengers.find((p) => p.id === booking.passengerId);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      accountId: driverAccount.id,
      type: 'income',
      category: 'ticket_sale',
      categoryLabel: 'Оплата наличными водителю (на посадке)',
      amount: booking.price,
      currency: booking.currency,
      status: 'confirmed',
      date: nowStr,
      description: `Прием наличных: место №${booking.seatNumber} (${passenger?.fullName || 'Пассажир'}), рейс #${booking.tripId}`,
      createdBy: `${currentUser.name} (Водитель)`,
      tripId: booking.tripId,
      bookingId,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const setPassengerBoarding = (bookingId: string, status: BoardingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, boardingStatus: status } : b))
    );
  };

  const addIncident = (vehicleId: string, description: string, reportedBy?: string) => {
    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newIncident: Incident = {
      id: `inc_${Date.now()}`,
      vehicleId,
      reportedBy: reportedBy || `${currentUser.name} (${currentUser.roleLabel})`,
      reportedAt: nowStr,
      description,
      status: 'open',
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              status: v.status === 'in_trip' ? 'in_trip' : 'repair',
              incidents: [newIncident, ...v.incidents],
            }
          : v
      )
    );
  };

  const resolveIncident = (vehicleId: string, incidentId: string) => {
    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const updatedIncidents = v.incidents.map((inc) =>
          inc.id === incidentId
            ? { ...inc, status: 'resolved' as const, resolvedAt: nowStr }
            : inc
        );
        const hasOpen = updatedIncidents.some((i) => i.status !== 'resolved');
        return {
          ...v,
          status: hasOpen ? 'repair' : 'ready',
          incidents: updatedIncidents,
        };
      })
    );
  };

  const toggleEquipmentItem = (vehicleId: string, equipmentId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const updatedEquipment = v.equipment.map((eq) => {
          if (eq.id !== equipmentId) return eq;
          const nextStatus: 'present' | 'missing' = eq.status === 'present' ? 'missing' : 'present';
          return {
            ...eq,
            status: nextStatus,
            checkedAt: 'Сегодня, ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            checkedBy: currentUser.name,
          };
        });
        return { ...v, equipment: updatedEquipment };
      })
    );
  };

  const approveTransaction = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.status !== 'pending_approval') return;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'confirmed',
              approvedBy: `${currentUser.name} (${currentUser.roleLabel})`,
            }
          : t
      )
    );
  };

  const rejectTransaction = (transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'rejected',
              approvedBy: `${currentUser.name} (${currentUser.roleLabel}) [Отклонено]`,
            }
          : t
      )
    );
  };

  const addExpenseRequest = ({
    accountId,
    category,
    categoryLabel,
    amount,
    currency,
    description,
    vehicleId,
    tripId,
    supplierName,
    invoiceNumber,
    liters,
    receiptAttachment,
  }: {
    accountId: string;
    category: 'fuel' | 'repair' | 'salary' | 'fine' | 'other';
    categoryLabel: string;
    amount: number;
    currency: string;
    description: string;
    vehicleId?: string;
    tripId?: string;
    supplierName?: string;
    invoiceNumber?: string;
    liters?: number;
    receiptAttachment?: any;
  }) => {
    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isMechanicOrDriver = currentUser.role === 'mechanic' || currentUser.role === 'driver';

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      accountId,
      type: 'expense',
      category,
      categoryLabel,
      amount,
      currency,
      status: isMechanicOrDriver ? 'pending_approval' : 'confirmed',
      date: nowStr,
      description,
      createdBy: `${currentUser.name} (${currentUser.roleLabel})`,
      approvedBy: isMechanicOrDriver ? undefined : `${currentUser.name} (${currentUser.roleLabel})`,
      vehicleId,
      tripId,
      supplierName,
      invoiceNumber,
      liters,
      receiptAttachment,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const addVehicleDocument = (vehicleId: string, doc: any) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, documents: [doc, ...v.documents] }
          : v
      )
    );
  };

  const addVehicleServiceRecord = (vehicleId: string, srv: any) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, serviceRecords: [srv, ...v.serviceRecords] }
          : v
      )
    );
  };

  const toggleCheckpoint = (tripId: string, stopId: string) => {
    const nowStr = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        const newCheckpoints = t.checkpoints.map((cp) => {
          if (cp.stopId !== stopId) return cp;
          const nextIsPassed = !cp.isPassed;
          return {
            ...cp,
            isPassed: nextIsPassed,
            passedTime: nextIsPassed ? nowStr : undefined,
          };
        });
        const passedCount = newCheckpoints.filter((checkpoint) => checkpoint.isPassed).length;
        const status =
          t.status === 'cancelled'
            ? 'cancelled'
            : newCheckpoints.length > 0 && passedCount === newCheckpoints.length
              ? 'completed'
              : passedCount > 0
                ? 'in_progress'
                : t.status === 'boarding'
                  ? 'boarding'
                  : 'scheduled';

        return { ...t, status, checkpoints: newCheckpoints };
      })
    );
  };

  const executeAIPrompt = (prompt: string): { success: boolean; message: string; action?: string } => {
    const p = prompt.toLowerCase();

    if (p.includes('фара') || p.includes('треснула') || p.includes('неисправност') || p.includes('поломк')) {
      const targetVehicle = vehicles.find(
        (v) => v.plateNumber.includes('112') || v.plateNumber.includes('12') || v.id.includes('12')
      ) || vehicles[0];

      if (targetVehicle) {
        addIncident(
          targetVehicle.id,
          'Треснула задняя правая фара (сообщение водителя/бота)',
          'AI-Ассистент'
        );
        return {
          success: true,
          action: 'INCIDENT_CREATED',
          message: `✅ Зафиксирована неисправность по машине ${targetVehicle.plateNumber} («${targetVehicle.brandModel}»): Треснула задняя правая фара. Карточка машины обновлена.`,
        };
      }
    }

    if (p.includes('баланс') || p.includes('касс') || p.includes('деньг') || p.includes('счет')) {
      const currencyTotals = accounts.reduce<Record<string, number>>((totals, account) => {
        totals[account.currency] =
          (totals[account.currency] || 0) + getAccountBalance(account.id);
        return totals;
      }, {});
      const balanceSummary = Object.entries(currencyTotals)
        .map(([currency, balance]) =>
          `${balance.toLocaleString('ru-RU')} ${currency === 'RUB' ? '₽' : currency}`
        )
        .join(', ');
      return {
        success: true,
        action: 'FINANCE_QUERY',
        message: `📊 Текущие остатки: ${balanceSummary}.`,
      };
    }

    if (p.includes('бронь') || p.includes('пассажир') || p.includes('место')) {
      const trip = trips[0];
      const result = createBookingWithPayment({
        tripId: trip.id,
        fullName: 'Роман Белов',
        phone: '+7 905 111-22-33',
        seatNumber: 4,
        fromStop: 'Москва (Северные Ворота)',
        toStop: 'Минск (Центральный)',
        price: trip.basePrice,
        currency: trip.currency,
        payNow: true,
        accountId: 'acc_cash_rub',
      });
      return {
        success: true,
        action: 'BOOKING_CREATED',
        message: `🎟️ Пассажир Роман Белов успешно записан на рейс ${trip.tripNumber} (место №4). Оплата ${trip.basePrice} ₽ внесена в кассу.`,
      };
    }

    return {
      success: true,
      message: `🤖 Команда обработана. Запрос принят в рабочее пространство «${company.name}». Права сотрудника (${currentUser.roleLabel}) проверены.`,
    };
  };

  const resetToDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCompany(INITIAL_COMPANY);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[1]);
    setVehicles(INITIAL_VEHICLES);
    setRoutes(INITIAL_ROUTES);
    setTrips(INITIAL_TRIPS);
    setBookings(INITIAL_BOOKINGS);
    setRequests(INITIAL_REQUESTS);
    setPassengers(INITIAL_PASSENGERS);
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
  };

  const createRequest = (params: {
    passengerName: string;
    phone: string;
    fromCity: string;
    toCity: string;
    desiredDate: string;
    desiredTime?: string;
    seatsCount: number;
    type?: 'passenger' | 'parcel';
    parcelDescription?: string;
    priceEstimate?: number;
    currency?: 'RUB' | 'KZT' | 'BYN';
    notes?: string;
    source?: 'telegram' | 'website' | 'phone' | 'dispatcher';
  }) => {
    const newId = `req_${Date.now()}`;
    const nextNumber = `З-${1050 + requests.length}`;
    const newReq: PassengerRequest = {
      id: newId,
      requestNumber: nextNumber,
      passengerName: params.passengerName,
      phone: params.phone,
      fromCity: params.fromCity,
      toCity: params.toCity,
      desiredDate: params.desiredDate,
      desiredTime: params.desiredTime,
      seatsCount: params.seatsCount,
      type: params.type || 'passenger',
      parcelDescription: params.parcelDescription,
      status: 'new',
      source: params.source || 'dispatcher',
      priceEstimate: params.priceEstimate,
      currency: params.currency || 'RUB',
      notes: params.notes,
      createdAt: 'Только что',
    };
    setRequests((prev) => [newReq, ...prev]);
    return newId;
  };

  const assignRequestToTrip = (requestId: string, tripId: string, seatNumber?: number) => {
    const trip = trips.find((t) => t.id === tripId);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'assigned',
              assignedTripId: tripId,
              assignedTripNumber: trip?.tripNumber || tripId,
              assignedSeatNumber: seatNumber,
            }
          : r
      )
    );
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
  };

  const deleteRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <AppContext.Provider
      value={{
        company,
        currentUser,
        users,
        vehicles,
        routes,
        trips,
        bookings,
        requests,
        passengers,
        accounts,
        transactions,
        getAccountBalance,
        switchUserRole,
        assignVehicleAndDriver,
        createRequest,
        assignRequestToTrip,
        updateRequestStatus,
        deleteRequest,
        createBookingWithPayment,
        markBookingPaid,
        collectCashByDriver,
        setPassengerBoarding,
        addIncident,
        resolveIncident,
        toggleEquipmentItem,
        approveTransaction,
        rejectTransaction,
        addExpenseRequest,
        addVehicleDocument,
        addVehicleServiceRecord,
        toggleCheckpoint,
        executeAIPrompt,
        resetToDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
