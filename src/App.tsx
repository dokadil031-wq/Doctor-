/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Page, BookingInfo } from './types';
import { Home } from './screens/Home';
import { DoctorsList } from './screens/DoctorsList';
import { Booking } from './screens/Booking';
import { Confirmation } from './screens/Confirmation';
import { Profile } from './screens/Profile';
import { Register } from './screens/Register';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { Tickets } from './screens/Tickets';
import { SupportChat } from './screens/SupportChat';
import { DoctorDashboard } from './screens/DoctorDashboard';
import { Home as HomeIcon, Search, Ticket, User, Building2 } from 'lucide-react';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { DOCTORS } from './data';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [direction, setDirection] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Sab');
  const [userLocation, setUserLocation] = useState('Detecting...');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingInfo[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    let unsubBookings: (() => void) | undefined;
    let unsubDoctors: (() => void) | undefined;
    
    unsubDoctors = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setDoctorsList(docs);
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setIsAuthLoaded(true);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            let userLoc = "New Delhi";
            try {
              if ('geolocation' in navigator) {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
                });
                const { latitude, longitude } = pos.coords;
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                userLoc = data.address?.city || data.address?.state_district || data.address?.state || "Detected Location";
              }
            } catch (e) {
              console.error('Location detection failed', e);
            }
            setUserLocation(userLoc);

            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || null,
              name: user.displayName || null,
              location: userLoc,
              phone: user.phoneNumber || null,
              createdAt: Date.now()
            });
          } else {
            setUserLocation(userDoc.data()?.location || 'New Delhi');
          }
        } catch (e) {
          console.error(e);
        }
        
        try {
          const docsSnap = await getDocs(query(collection(db, 'doctors'), where('creatorId', '==', user.uid)));
          const isDocUser = !docsSnap.empty;
          setCurrentPage(curr => (curr === 'login' || curr === 'signup' || curr === 'home') ? (isDocUser ? 'dashboard' : 'home') : curr);
        } catch(e) {
          setCurrentPage(curr => curr === 'login' || curr === 'signup' ? 'home' : curr);
        }
        
        if (unsubBookings) unsubBookings();
        const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
        unsubBookings = onSnapshot(q, (snapshot) => {
          const loadedBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setBookings(loadedBookings.sort((a,b) => b.createdAt - a.createdAt));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'bookings');
        });
        
        const seedDoctors = async () => {
          try {
            const doctorsSnap = await getDocs(collection(db, 'doctors'));
            if (doctorsSnap.empty) {
               for (const docData of DOCTORS) {
                 await setDoc(doc(db, 'doctors', docData.id), docData);
               }
            }
          } catch(e) { console.error('Seed doctors error', e) }
        }
        seedDoctors();
      } else {
        if (unsubBookings) unsubBookings();
        setBookings([]);
        setCurrentPage('login');
      }
    });

    return () => {
      unsubAuth();
      if (unsubBookings) unsubBookings();
      if (unsubDoctors) unsubDoctors();
    };
  }, []);

  if (!isAuthLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] text-brand-teal font-bold text-xl">Loading...</div>;
  }


  const goTo = (page: Page, isBack: boolean = false) => {
    setDirection(isBack ? -1 : 1);
    setCurrentPage(page);
  };

  const updateUserLocation = async (loc: string) => {
    setUserLocation(loc);
    if (authUser) {
      try {
        await setDoc(doc(db, 'users', authUser.uid), { location: loc, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error('Failed to update location', e);
      }
    }
  };


  const isDoctor = authUser ? doctorsList.some(d => d.creatorId === authUser.uid) : false;

  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'doctors', icon: Search, label: 'Search' },
    { id: 'tickets', icon: Ticket, label: 'Tickets' },
    ...(isDoctor ? [{ id: 'dashboard', icon: Building2, label: 'Clinic' }] : []),
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const showBottomNav = ['home', 'doctors', 'profile', 'tickets', 'dashboard'].includes(currentPage);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-30%',
      opacity: direction > 0 ? 1 : 0.5,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { type: 'tween', ease: 'circOut', duration: 0.35 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-30%',
      opacity: direction < 0 ? 1 : 0.5,
      transition: { type: 'tween', ease: 'circOut', duration: 0.35 }
    })
  };

  const handleBook = async (booking: BookingInfo, selectedDateId: string) => {
    if (!authUser) return;
    try {
      const now = Date.now();
      
      const q = query(
        collection(db, 'doctors', booking.doctorId, 'bookedSlots')
      );
      const snap = await getDocs(q);
      const sameDateSlots = snap.docs.filter(d => d.id.startsWith((booking.rawDate || selectedDateId) + '_'));
      const tokenNumber = sameDateSlots.length + 1;
      const realToken = 'T-' + tokenNumber.toString().padStart(2, '0');

      const bookingData = {
        ...booking,
        token: realToken,
        userId: authUser.uid,
        status: 'upcoming',
        createdAt: now,
        updatedAt: now
      };
      // Write booking
      await setDoc(doc(db, 'bookings', booking.id), bookingData);
      
      // Write booked slot to prevent others from booking it
      const slotId = `${selectedDateId}_${booking.timeSlot}`;
      await setDoc(doc(db, 'doctors', booking.doctorId, 'bookedSlots', slotId), {
         bookedAt: now,
         userId: authUser.uid
      });

      setSelectedTicketId(booking.id);
    } catch (e) {
      console.error(e);
      alert('Failed to book token.');
    }
  };

  const viewingBooking = bookings.find(b => b.id === selectedTicketId) || bookings[bookings.length - 1] || null;

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-200 py-0 sm:py-8 font-sans text-text-main">
      <div className="w-full sm:w-[375px] h-[100dvh] sm:h-[800px] bg-[#f5f7fa] sm:rounded-[40px] sm:border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Fake Status Bar */}
        <div className="h-6 w-full absolute top-0 z-50 flex justify-between px-5 pt-1.5 text-[11px] font-bold text-slate-800 mix-blend-color-burn opacity-80 pointer-events-none">
          <span>9:41</span>
          <div className="flex gap-1.5">
            <span>●●●</span>
            <span>LTE</span>
            <span>🔋</span>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 overflow-y-auto no-scrollbar bg-[#f5f7fa]"
            >
              {currentPage === 'home' && (
                <Home 
                  goTo={goTo} 
                  searchQuery={searchQuery} 
                  setSearchQuery={setSearchQuery} 
                  setActiveFilter={setActiveFilter}
                  onSelectDoctor={setSelectedDoctorId}
                  userLocation={userLocation}
                  setUserLocation={updateUserLocation}
                  doctors={doctorsList}
                />
              )}
              {currentPage === 'doctors' && (
                <DoctorsList 
                  goTo={goTo} 
                  onSelectDoctor={setSelectedDoctorId}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  doctors={doctorsList}
                />
              )}
              {currentPage === 'booking' && (
                <Booking 
                  goTo={goTo} 
                  doctorId={selectedDoctorId} 
                  onBook={handleBook} 
                  doctors={doctorsList}
                />
              )}
              {currentPage === 'confirm' && (
                <Confirmation 
                  goTo={goTo} 
                  booking={viewingBooking} 
                  doctors={doctorsList}
                />
              )}
              {currentPage === 'tickets' && (
                <Tickets 
                  goTo={goTo} 
                  bookings={bookings} 
                  onSelectTicket={setSelectedTicketId} 
                  doctors={doctorsList}
                />
              )}
              {currentPage === 'profile' && <Profile goTo={goTo} bookings={bookings} doctors={doctorsList} userLocation={userLocation} setUserLocation={updateUserLocation} isDoctor={isDoctor} authUser={authUser} />}
              {currentPage === 'support' && <SupportChat goTo={goTo} />}
              {currentPage === 'register' && <Register goTo={goTo} />}
              {currentPage === 'dashboard' && <DoctorDashboard goTo={goTo} doctors={doctorsList} authUser={authUser} />}
              {currentPage === 'login' && <Login goTo={goTo} />}
              {currentPage === 'signup' && <Signup goTo={goTo} setUserLocation={updateUserLocation} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        {showBottomNav && (
          <div className="bg-white border-t border-slate-100 flex pb-6 pt-2 z-50 px-2 justify-between">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id as Page)}
                  className="flex-1 flex flex-col items-center gap-1 py-1 transition-transform active:scale-95"
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-brand-teal scale-110' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-[10px] font-semibold ${active ? 'text-brand-teal' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
