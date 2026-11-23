'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Company,
  User,
  Vehicle,
  Trailer,
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
  ActivityLogItem,
  TripCheckpoint,
} from '@/types';
import {
  INITIAL_COMPANY,
  INITIAL_USERS,
  INITIAL_VEHICLES,
  INITIAL_TRAILERS,
  INITIAL_ROUTES,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_PASSENGERS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_REQUESTS,
  INITIAL_ACTIVITIES,
} from './mockData';

interface AppContextType {
  company: Company;
  currentUser: User;
  users: User[];
  vehicles: Vehicle[];
  trailers: Trailer[];
  routes: Route[];
  trips: Trip[];
  bookings: Booking[];
  requests: PassengerRequest[];
  passengers: Passenger[];
  accounts: FinanceAccount[];
  transactions: Transaction[];
  activities: ActivityLogItem[];
  getAccountBalance: (accountId: string) => number;
  switchUserRole: (role: Role) => void;
  assignVehicleAndDriver: (tripId: string, vehicleId: string, driverId: string) => void;
  createVehicle: (params: Partial<Vehicle>) => string;
  updateVehicle: (id: string, params: Partial<Vehicle>) => void;
  archiveVehicle: (id: string) => void;
  createTrailer: (params: Partial<Trailer>) => string;
  updateTrailer: (id: string, params: Partial<Trailer>) => void;
  archiveTrailer: (id: string) => void;
  createRoute: (params: Partial<Route>) => string;
  updateRoute: (id: string, params: Partial<Route>) => void;
  archiveRoute: (id: string) => void;
  createTrip: (params: Partial<Trip>) => string;
  updateTrip: (id: string, params: Partial<Trip>) => void;
  archiveTrip: (id: string) => void;
  logActivity: (params: {
    action: 'create' | 'update' | 'archive' | 'status_change';
    entityType: 'vehicle' | 'trailer' | 'trip' | 'route' | 'booking' | 'request';
    entityName: string;
    details: string;
  }) => void;
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
  transferBookingToTrip: (bookingId: string, targetTripId: string, targetSeatNumber?: number) => void;
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
  cancelBooking: (bookingId: string) => void;
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

const STORAGE_KEY = 'bumerang_demo_state_v7';

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
  const [trailers, setTrailers] = useState<Trailer[]>(INITIAL_TRAILERS);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [requests, setRequests] = useState<PassengerRequest[]>(INITIAL_REQUESTS);
  const [passengers, setPassengers] = useState<Passenger[]>(INITIAL_PASSENGERS);
  const [accounts, setAccounts] = useState<FinanceAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activities, setActivities] = useState<ActivityLogItem[]>(INITIAL_ACTIVITIES);

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
        if (Array.isArray(parsed.trailers)) setTrailers(parsed.trailers);
        if (Array.isArray(parsed.activities)) setActivities(parsed.activities);
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

  // Auto-sync assigned requests with bookings and passengers
  useEffect(() => {
    if (!isLoaded) return;
    const assignedReqs = requests.filter((r) => r.status === 'assigned' && r.assignedTripId);
    if (!assignedReqs.length) return;

    let needUpdateBookings = false;
    let needUpdatePassengers = false;
    const newBookings = [...bookings];
    const newPassengers = [...passengers];

    assignedReqs.forEach((req) => {
      let pass = newPassengers.find((p) => p.phone === req.phone || p.fullName === req.passengerName);
      if (!pass) {
        pass = {
          id: `pass_req_${req.id}`,
          fullName: req.passengerName,
          phone: req.phone,
          totalTrips: 1,
          notes: req.notes,
        };
        newPassengers.push(pass);
        needUpdatePassengers = true;
      }

      const hasBooking = newBookings.some(
        (b) => b.tripId === req.assignedTripId && (b.passengerId === pass!.id || b.id === `book_req_${req.id}`)
      );

      if (!hasBooking) {
        const tripBookings = newBookings.filter((b) => b.tripId === req.assignedTripId);
        const occupied = new Set(tripBookings.map((b) => b.seatNumber));
        let seat = req.assignedSeatNumber;
        if (!seat || occupied.has(seat)) {
          for (let s = 1; s <= 19; s++) {
            if (!occupied.has(s)) {
              seat = s;
              break;
            }
          }
        }
        if (!seat) seat = tripBookings.length + 1;

        newBookings.push({
          id: `book_req_${req.id}`,
          tripId: req.assignedTripId!,
          passengerId: pass.id,
          seatNumber: seat,
          fromStop: req.fromCity,
          toStop: req.toCity,
          price: req.priceEstimate || 3800,
          currency: req.currency || 'RUB',
          status: 'confirmed',
          paymentMethod: 'cash_driver',
          boardingStatus: 'waiting',
          createdAt: req.createdAt || 'Только что',
        });
        needUpdateBookings = true;
      }
    });

    if (needUpdatePassengers) setPassengers(newPassengers);
    if (needUpdateBookings) setBookings(newBookings);
  }, [isLoaded, requests]);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const state = {
        company,
        users,
        currentUser,
        vehicles,
        trailers,
        routes,
        trips,
        bookings,
        requests,
        passengers,
        accounts,
        transactions,
        activities,
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
    trailers,
    routes,
    trips,
    bookings,
    requests,
    passengers,
    accounts,
    transactions,
    activities,
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

    const cashAccount = accounts.find((a) => a.id === 'acc_cash') || accounts[1] || accounts[0];
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
              accountId: cashAccount.id,
              collectedByDriver: true,
            }
          : b
      )
    );

    const passenger = passengers.find((p) => p.id === booking.passengerId);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      accountId: cashAccount.id,
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

  const cancelBooking = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    const passenger = passengers.find((p) => p.id === booking.passengerId);
    if (passenger) {
      setRequests((prev) =>
        prev.map((r) =>
          r.assignedTripId === booking.tripId &&
          (r.phone === passenger.phone || r.passengerName === passenger.fullName)
            ? {
                ...r,
                status: 'new',
                assignedTripId: undefined,
                assignedTripNumber: undefined,
                assignedSeatNumber: undefined,
              }
            : r
        )
      );
    }
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

        const targetIdx = t.checkpoints.findIndex((cp) => cp.stopId === stopId);
        if (targetIdx === -1) return t;

        const targetCp = t.checkpoints[targetIdx];
        const nextIsPassed = !targetCp.isPassed;

        const newCheckpoints = t.checkpoints.map((cp, idx) => {
          if (nextIsPassed) {
            // При выборе точки (например, Минск) — эта точка и ВСЕ предыдущие до неё автоматически отмечаются пройденными
            if (idx <= targetIdx) {
              return {
                ...cp,
                isPassed: true,
                passedTime: cp.isPassed && cp.passedTime ? cp.passedTime : nowStr,
              };
            }
            return cp;
          } else {
            // При снятии отметки с точки — эта точка и ВСЕ последующие за ней сбрасываются в непройденные (белые)
            if (idx >= targetIdx) {
              return {
                ...cp,
                isPassed: false,
                passedTime: undefined,
              };
            }
            return cp;
          }
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
        accountId: 'acc_cash',
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
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    // Pick a seat
    const tripBookings = bookings.filter((b) => b.tripId === tripId);
    const occupiedSeats = new Set(tripBookings.map((b) => b.seatNumber));
    const veh = vehicles.find((v) => v.id === trip?.vehicleId);
    const maxCapacity = veh?.seatsCount || 19;

    let assignedSeat = seatNumber;
    if (!assignedSeat || occupiedSeats.has(assignedSeat)) {
      for (let i = 1; i <= maxCapacity; i++) {
        if (!occupiedSeats.has(i)) {
          assignedSeat = i;
          break;
        }
      }
    }
    if (!assignedSeat) assignedSeat = tripBookings.length + 1;

    // Create real passenger record
    const passengerId = `pass_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newPassenger: Passenger = {
      id: passengerId,
      fullName: req.passengerName,
      phone: req.phone,
      totalTrips: 1,
      notes: req.notes,
    };
    setPassengers((prev) => [newPassenger, ...prev]);

    // Create real booking record
    const bookingId = `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBooking: Booking = {
      id: bookingId,
      tripId: tripId,
      passengerId: passengerId,
      seatNumber: assignedSeat,
      fromStop: req.fromCity,
      toStop: req.toCity,
      price: req.priceEstimate || trip?.basePrice || 2500,
      currency: req.currency || trip?.currency || 'RUB',
      status: 'confirmed',
      paymentMethod: 'cash_driver',
      boardingStatus: 'waiting',
      createdAt: 'Только что',
    };
    setBookings((prev) => [newBooking, ...prev]);

    // Update request
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'assigned',
              assignedTripId: tripId,
              assignedTripNumber: trip?.tripNumber || tripId,
              assignedSeatNumber: assignedSeat,
            }
          : r
      )
    );

    logActivity({
      action: 'create',
      entityType: 'booking',
      entityName: `${req.passengerName} (Место №${assignedSeat})`,
      details: `Пассажир из заявки ${req.requestNumber} назначен в рейс ${trip?.tripNumber || tripId}.`,
    });
  };

  const transferBookingToTrip = (bookingId: string, targetTripId: string, targetSeatNumber?: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const targetTrip = trips.find((t) => t.id === targetTripId);
    if (!booking || !targetTrip) return;

    const oldTrip = trips.find((t) => t.id === booking.tripId);

    // Pick seat on target trip
    const targetBookings = bookings.filter((b) => b.tripId === targetTripId && b.id !== bookingId);
    const occupiedSeats = new Set(targetBookings.map((b) => b.seatNumber));
    const veh = vehicles.find((v) => v.id === targetTrip.vehicleId);
    const maxCapacity = veh?.seatsCount || 19;

    let newSeat = targetSeatNumber;
    if (!newSeat || occupiedSeats.has(newSeat)) {
      for (let i = 1; i <= maxCapacity; i++) {
        if (!occupiedSeats.has(i)) {
          newSeat = i;
          break;
        }
      }
    }
    if (!newSeat) newSeat = targetBookings.length + 1;

    // Update booking
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              tripId: targetTripId,
              seatNumber: newSeat,
            }
          : b
      )
    );

    // Update passenger request if linked
    const passenger = passengers.find((p) => p.id === booking.passengerId);
    if (passenger) {
      setRequests((prev) =>
        prev.map((r) =>
          (r.assignedTripId === booking.tripId || r.phone === passenger.phone || r.passengerName === passenger.fullName) &&
          r.status === 'assigned'
            ? {
                ...r,
                assignedTripId: targetTripId,
                assignedTripNumber: targetTrip.tripNumber,
                assignedSeatNumber: newSeat,
              }
            : r
        )
      );
    }

    logActivity({
      action: 'update',
      entityType: 'booking',
      entityName: `${passenger?.fullName || 'Пассажир'} (Место №${newSeat})`,
      details: `Пассажир перенесён из рейса ${oldTrip?.tripNumber || booking.tripId} в рейс ${targetTrip.tripNumber}.`,
    });
  };

  const updateRequestStatus = (requestId: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
  };

  const deleteRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const logActivity = (params: {
    action: 'create' | 'update' | 'archive' | 'status_change';
    entityType: 'vehicle' | 'trailer' | 'trip' | 'route' | 'booking' | 'request';
    entityName: string;
    details: string;
  }) => {
    const nowStr = new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const newAct: ActivityLogItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowStr,
      actorName: currentUser.name,
      ...params,
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const createVehicle = (params: Partial<Vehicle>): string => {
    const newId = `veh_${Date.now()}`;
    const newVehicle: Vehicle = {
      id: newId,
      brandModel: params.brandModel || 'Mercedes-Benz Sprinter 516',
      plateNumber: params.plateNumber || 'А 000 АА 77',
      garageNumber: params.garageNumber || `ГАРАЖ-0${vehicles.length + 1}`,
      seatsCount: params.seatsCount || 19,
      year: params.year || 2023,
      type: params.type || 'minibus',
      status: params.status || 'ready',
      currentLocation: params.currentLocation || 'База Москва',
      baseCity: params.baseCity || 'Москва',
      mileageKm: params.mileageKm || 120000,
      nextServiceKm: params.nextServiceKm || 130000,
      vin: params.vin || 'WDB906' + Math.floor(Math.random() * 1000000),
      assignedDriverName: params.assignedDriverName || 'Диспетчерский резерв',
      photos: params.photos?.length ? params.photos : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
      incidents: [],
      equipment: [
        { id: `eq_1_${Date.now()}`, name: 'Тахограф СКЗИ (калиброван)', category: 'docs', required: true, status: 'present' },
        { id: `eq_2_${Date.now()}`, name: 'Аптечка первой помощи (ГОСТ)', category: 'safety', required: true, status: 'present' },
        { id: `eq_3_${Date.now()}`, name: 'Огнетушитель ОП-4 (2 шт)', category: 'safety', required: true, status: 'present' },
      ],
      documents: [],
      serviceRecords: [],
      ...params,
    };
    setVehicles((prev) => [newVehicle, ...prev]);
    logActivity({
      action: 'create',
      entityType: 'vehicle',
      entityName: `${newVehicle.brandModel} (${newVehicle.plateNumber})`,
      details: `Машина поставлена на баланс. База: ${newVehicle.baseCity}, ${newVehicle.seatsCount} мест.`,
    });
    return newId;
  };

  const updateVehicle = (id: string, params: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...params } : v))
    );
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      logActivity({
        action: 'update',
        entityType: 'vehicle',
        entityName: `${params.brandModel || v.brandModel} (${params.plateNumber || v.plateNumber})`,
        details: `Отредактированы параметры машины.`,
      });
    }
  };

  const archiveVehicle = (id: string) => {
    const v = vehicles.find((item) => item.id === id);
    setVehicles((prev) => prev.filter((item) => item.id !== id));
    if (v) {
      logActivity({
        action: 'archive',
        entityType: 'vehicle',
        entityName: `${v.brandModel} (${v.plateNumber})`,
        details: `Машина полностью удалена из автопарка.`,
      });
    }
  };

  const createTrailer = (params: Partial<Trailer>): string => {
    const newId = `trl_${Date.now()}`;
    const newTrailer: Trailer = {
      id: newId,
      model: params.model || 'МЗСА 817717 (Тент)',
      plateNumber: params.plateNumber || 'АЕ 0000 77',
      garageNumber: params.garageNumber || `ПР-0${trailers.length + 1}`,
      capacityKg: params.capacityKg || 750,
      volumeM3: params.volumeM3 || 8.5,
      status: params.status || 'ready',
      currentLocation: params.currentLocation || 'База',
      baseCity: params.baseCity || 'Москва',
      year: params.year || 2023,
      ...params,
    };
    setTrailers((prev) => [newTrailer, ...prev]);
    logActivity({
      action: 'create',
      entityType: 'trailer',
      entityName: `Прицеп ${newTrailer.model} (${newTrailer.plateNumber})`,
      details: `Прицеп принят в автопарк. Грузоподъемность: ${newTrailer.capacityKg} кг, объем: ${newTrailer.volumeM3} м³.`,
    });
    return newId;
  };

  const updateTrailer = (id: string, params: Partial<Trailer>) => {
    setTrailers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...params } : t))
    );
    const t = trailers.find((item) => item.id === id);
    if (t) {
      logActivity({
        action: 'update',
        entityType: 'trailer',
        entityName: `Прицеп ${params.model || t.model} (${params.plateNumber || t.plateNumber})`,
        details: `Обновлены параметры прицепа.`,
      });
    }
  };

  const archiveTrailer = (id: string) => {
    const t = trailers.find((item) => item.id === id);
    setTrailers((prev) => prev.filter((item) => item.id !== id));
    if (t) {
      logActivity({
        action: 'archive',
        entityType: 'trailer',
        entityName: `Прицеп ${t.model} (${t.plateNumber})`,
        details: `Прицеп полностью удалён из автопарка.`,
      });
    }
  };

  const createRoute = (params: Partial<Route>): string => {
    const newId = `route_${Date.now()}`;
    const newRoute: Route = {
      id: newId,
      name: params.name || `${params.departureCity || 'Город А'} — ${params.arrivalCity || 'Город Б'}`,
      departureCity: params.departureCity || 'Город А',
      arrivalCity: params.arrivalCity || 'Город Б',
      totalDistanceKm: params.totalDistanceKm || 500,
      estimatedDurationHours: params.estimatedDurationHours || 7,
      stops: params.stops || [],
      ...params,
    };
    setRoutes((prev) => [newRoute, ...prev]);
    logActivity({
      action: 'create',
      entityType: 'route',
      entityName: `Маршрут «${newRoute.name}»`,
      details: `Создан новый маршрут (${newRoute.totalDistanceKm} км, ~${newRoute.estimatedDurationHours} ч).`,
    });
    return newId;
  };

  const updateRoute = (id: string, params: Partial<Route>) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...params } : r))
    );
    const r = routes.find((item) => item.id === id);
    if (r) {
      logActivity({
        action: 'update',
        entityType: 'route',
        entityName: `Маршрут «${params.name || r.name}»`,
        details: `Изменены параметры и промежуточные остановки маршрута.`,
      });
    }
  };

  const archiveRoute = (id: string) => {
    const r = routes.find((item) => item.id === id);
    setRoutes((prev) => prev.filter((item) => item.id !== id));
    if (r) {
      logActivity({
        action: 'archive',
        entityType: 'route',
        entityName: `Маршрут «${r.name}»`,
        details: `Маршрут полностью удалён из системы.`,
      });
    }
  };

  const createTrip = (params: Partial<Trip>): string => {
    const newId = `trip_${Date.now()}`;
    const route = routes.find((r) => r.id === params.routeId);
    const checkpoints: TripCheckpoint[] = route?.stops?.map((s) => ({
      stopId: s.id,
      stopName: s.name,
      scheduledTime: params.departureTime || '10:00',
      isPassed: false,
    })) || [
      { stopId: 'st_1', stopName: params.routeName?.split('—')[0]?.trim() || 'Отправление', scheduledTime: params.departureTime || '10:00', isPassed: false },
      { stopId: 'st_2', stopName: params.routeName?.split('—')[1]?.trim() || 'Прибытие', scheduledTime: '18:00', isPassed: false },
    ];

    const newTrip: Trip = {
      id: newId,
      tripNumber: params.tripNumber || `БУМ-${trips.length + 106}`,
      routeId: params.routeId || route?.id || 'route_default',
      routeName: params.routeName || route?.name || 'Новый рейс',
      departureDate: params.departureDate || 'Сегодня',
      departureTime: params.departureTime || '10:00',
      vehicleId: params.vehicleId,
      trailerId: params.trailerId,
      driverId: params.driverId,
      status: params.status || 'scheduled',
      basePrice: params.basePrice || 3500,
      currency: params.currency || 'RUB',
      checkpoints,
      ...params,
    };
    setTrips((prev) => [newTrip, ...prev]);
    logActivity({
      action: 'create',
      entityType: 'trip',
      entityName: `Рейс ${newTrip.tripNumber} (${newTrip.routeName})`,
      details: `Сформирован рейс на ${newTrip.departureDate} ${newTrip.departureTime}. Базовая цена: ${newTrip.basePrice} ${newTrip.currency}.`,
    });
    return newId;
  };

  const updateTrip = (id: string, params: Partial<Trip>) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...params } : t))
    );
    const t = trips.find((item) => item.id === id);
    if (t) {
      logActivity({
        action: 'update',
        entityType: 'trip',
        entityName: `Рейс ${t.tripNumber} (${params.routeName || t.routeName})`,
        details: `Обновлены данные рейса (дата: ${params.departureDate || t.departureDate}, время: ${params.departureTime || t.departureTime}).`,
      });
    }
  };

  const archiveTrip = (id: string) => {
    const t = trips.find((item) => item.id === id);
    setTrips((prev) => prev.filter((item) => item.id !== id));
    setBookings((prev) => prev.filter((b) => b.tripId !== id));
    setRequests((prev) =>
      prev.map((r) =>
        r.assignedTripId === id
          ? {
              ...r,
              status: 'new',
              assignedTripId: undefined,
              assignedTripNumber: undefined,
              assignedSeatNumber: undefined,
            }
          : r
      )
    );
    if (t) {
      logActivity({
        action: 'archive',
        entityType: 'trip',
        entityName: `Рейс ${t.tripNumber} (${t.routeName})`,
        details: `Рейс полностью удалён из системы.`,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        company,
        currentUser,
        users,
        vehicles,
        trailers,
        routes,
        trips,
        bookings,
        requests,
        passengers,
        accounts,
        transactions,
        activities,
        getAccountBalance,
        switchUserRole,
        assignVehicleAndDriver,
        createVehicle,
        updateVehicle,
        archiveVehicle,
        createTrailer,
        updateTrailer,
        archiveTrailer,
        createRoute,
        updateRoute,
        archiveRoute,
        createTrip,
        updateTrip,
        archiveTrip,
        logActivity,
        createRequest,
        assignRequestToTrip,
        transferBookingToTrip,
        updateRequestStatus,
        deleteRequest,
        createBookingWithPayment,
        markBookingPaid,
        cancelBooking,
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
