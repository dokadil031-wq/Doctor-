import { ChevronRight, ClipboardList, Bell, MapPin, Building2, Star, HelpCircle, LogOut, X } from 'lucide-react';
import { GoToType } from '../types';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export function Profile({ goTo, bookings, doctors, userLocation, setUserLocation, isDoctor, authUser }: { goTo: GoToType, bookings: any[], doctors: any[], userLocation: string, setUserLocation: (l: string) => void, isDoctor: boolean, authUser: any }) {
  const [modalContent, setModalContent] = useState<{title: string, message: string} | null>(null);

  const handleLocationChange = () => {
    const loc = prompt('Mera address update karein:', userLocation);
    if (loc && loc.trim() !== '') {
      setUserLocation(loc.trim());
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch(e) {
      console.error(e);
    }
  };

  const MenuItem = ({ icon: Icon, title, sub, bg, color, onClick, arrowColor = 'text-slate-300' }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-white border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-sm font-bold ${color.includes('text-white') ? 'text-brand-teal' : color === 'text-red-600' ? 'text-red-600' : 'text-text-main'}`}>{title}</h4>
          <p className="text-[11px] text-text-muted mt-0.5 font-medium">{sub}</p>
        </div>
      </div>
      <ChevronRight className={`w-5 h-5 ${arrowColor}`} />
    </div>
  );

  const user = authUser || auth.currentUser;
  const userName = user?.displayName || 'User';
  const phoneOrEmail = user?.phoneNumber || user?.email || '';

  let activeTokens = 0;
  let pastVisits = 0;

  const now = new Date();
  const currentDate = now.toLocaleDateString('en-CA');
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  bookings?.forEach(booking => {
    const doc = doctors.find((d: any) => d.id === booking.doctorId);
    let isExpired = false;
    if (doc) {
      if (booking.rawDate) {
        if (booking.rawDate < currentDate) {
          isExpired = true;
        } else if (booking.rawDate === currentDate) {
          const endTimeStr = doc.endTime || '17:00';
          const [endH, endM] = endTimeStr.split(':').map(Number);
          if (currentH > endH || (currentH === endH && currentM >= endM)) {
            isExpired = true;
          }
        }
      } else if (booking.createdAt) {
        const createdDateStr = new Date(booking.createdAt).toLocaleDateString('en-CA');
        if (createdDateStr < currentDate) {
          isExpired = true;
        } else if (createdDateStr === currentDate) {
          const endTimeStr = doc.endTime || '17:00';
          const [endH, endM] = endTimeStr.split(':').map(Number);
          if (currentH > endH || (currentH === endH && currentM >= endM)) {
            isExpired = true;
          }
        }
      }
    }
    if (isExpired) {
      pastVisits++;
    } else {
      activeTokens++;
    }
  });

  return (
    <div className="pb-6 bg-[#f5f7fa] min-h-screen relative">
      <div className="bg-white px-5 pt-14 pb-5 border-b border-slate-100">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-teal-light to-brand-blue-light rounded-full flex overflow-hidden items-center justify-center mb-3 text-4xl shadow-sm">
           {user?.photoURL ? <img src={user.photoURL} alt={userName} className="w-full h-full object-cover" /> : '👤'}
        </div>
        <h1 className="text-xl font-extrabold text-text-main text-center font-nunito">{userName}</h1>
        <p className="text-[13px] text-text-muted text-center mt-1">{phoneOrEmail} {phoneOrEmail && '• '} {userLocation}</p>
        <div className="flex items-center justify-center gap-2 mt-3.5">
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-brand-teal-light text-brand-teal">{activeTokens} Active Tokens</span>
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-brand-blue-light text-brand-blue">{pastVisits} Past Visits</span>
        </div>
      </div>

      <div className="py-4">
        <div className="px-5 mb-1.5 text-[11px] font-bold text-slate-400 tracking-wider">AAPKA ACCOUNT</div>
        <MenuItem onClick={() => goTo('tickets')} icon={ClipboardList} title="Mere Tokens / Appointments" sub="Booking history dekho" bg="bg-brand-teal-light" color="text-brand-teal" />
        <MenuItem onClick={() => setModalContent({ title: 'Notifications', message: 'Abhi koi notifications nahi hain.' })} icon={Bell} title="Notifications" sub="SMS & WhatsApp alerts" bg="bg-brand-blue-light" color="text-brand-blue" />
        <MenuItem onClick={handleLocationChange} icon={MapPin} title="Mera Address" sub={userLocation} bg="bg-amber-100" color="text-amber-700" />
        
        <div className="px-5 mt-5 mb-1.5 text-[11px] font-bold text-slate-400 tracking-wider">DOCTOR/CLINIC?</div>
        <div className="bg-[#f9fffe]">
          {isDoctor ? (
            <MenuItem 
              onClick={() => goTo('dashboard')}
              icon={Building2} 
              title="Doctor Dashboard" 
              sub="Manage tokens and patients" 
              bg="bg-brand-teal" 
              color="text-white"
              arrowColor="text-brand-teal"
            />
          ) : (
            <MenuItem 
              onClick={() => goTo('register')}
              icon={Building2} 
              title="Clinic Register Karein" 
              sub="Free • Platform join karein" 
              bg="bg-brand-teal" 
              color="text-white"
              arrowColor="text-brand-teal"
            />
          )}
        </div>

        <div className="px-5 mt-5 mb-1.5 text-[11px] font-bold text-slate-400 tracking-wider">APP</div>
        <MenuItem onClick={() => setModalContent({ title: 'Rate Us', message: 'Thanks for wanting to rate us! Please visit the Play Store.' })} icon={Star} title="App ko Rate Karein" sub="Play Store pe review do" bg="bg-slate-100" color="text-slate-600" />
        <MenuItem onClick={() => goTo('support')} icon={HelpCircle} title="Help & Support" sub="Problem ho toh batao" bg="bg-slate-100" color="text-slate-600" />
        <MenuItem 
          onClick={handleLogout} 
          icon={LogOut} 
          title="Logout" 
          sub="Account se bahar jaayein" 
          bg="bg-red-50" 
          color="text-red-600" 
        />
      </div>

      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:absolute">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setModalContent(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[24px] p-6 shadow-2xl relative z-10 w-full max-w-xs"
            >
              <button 
                onClick={() => setModalContent(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-text-main mb-2 mt-2">{modalContent.title}</h3>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                {modalContent.message}
              </p>
              <button 
                onClick={() => setModalContent(null)}
                className="w-full bg-brand-teal text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
              >
                Theek Hai
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
