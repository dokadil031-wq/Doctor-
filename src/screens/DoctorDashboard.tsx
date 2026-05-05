import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, Calendar as CalendarIcon, Star } from 'lucide-react';
import { GoToType } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function DoctorDashboard({ goTo, doctors, authUser }: { goTo: GoToType, doctors: any[], authUser: any }) {
  const [activeDoctorId, setActiveDoctorId] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);

  const user = authUser || auth.currentUser;
  const myDoctors = user ? doctors.filter(d => d.creatorId === user.uid) : [];

  useEffect(() => {
    if (myDoctors.length > 0 && !activeDoctorId) {
      setActiveDoctorId(myDoctors[0].id);
    }
  }, [myDoctors, activeDoctorId]);

  useEffect(() => {
    if (!activeDoctorId) return;
    
    // Fetch bookings for this doctor
    const q = query(collection(db, 'bookings'), where('doctorId', '==', activeDoctorId));
    const unsub = onSnapshot(q, (snapshot) => {
      const boks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date/time (maybe created at for now, or start time)
      setAppointments(boks.sort((a,b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, [activeDoctorId]);

  const activeDoctor = myDoctors.find(d => d.id === activeDoctorId) || myDoctors[0];

  return (
    <div className="pb-10 bg-[#f5f7fa] min-h-screen">
      <div className="bg-brand-teal px-5 pt-8 pb-6 border-b border-brand-teal shadow-sm">
        <h1 className="text-xl font-bold text-white font-nunito flex items-center gap-2">
            Clinic Dashboard
        </h1>
        <p className="text-white/80 text-xs mt-1">Real-time patient waitlist manager</p>
      </div>

      <div className="px-5 mt-4">
        {myDoctors.length > 1 && (
            <div className="mb-4">
                <label className="text-xs font-bold text-text-muted mb-2 block">Selet Doctor/Clinic</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {myDoctors.map(doc => (
                        <button 
                            key={doc.id}
                            onClick={() => setActiveDoctorId(doc.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${activeDoctorId === doc.id ? 'bg-brand-blue text-white' : 'bg-white text-text-main border border-slate-200'}`}
                        >
                            {doc.name}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="w-8 h-8 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center mb-2">
                    <Users className="w-4 h-4" />
                </div>
                <span className="text-2xl font-black text-text-main leading-none">{appointments.length}</span>
                <span className="text-xs font-semibold text-text-muted mt-1">Total Tokens</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-2">
                    <Star className="w-4 h-4" />
                </div>
                <span className="text-2xl font-black text-text-main leading-none">{activeDoctor?.rating || '0.0'}</span>
                <span className="text-xs font-semibold text-text-muted mt-1">{activeDoctor?.reviews || 0} Reviews</span>
            </div>
        </div>

        <h2 className="font-bold text-text-main text-sm mb-3">Live Upcoming Tokens</h2>
        
        {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="font-bold text-text-main mb-1">No tokens yet</h3>
                <p className="text-xs text-text-muted">Appointments will appear here when patients book tokens.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {appointments.map(apt => (
                    <div key={apt.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-teal text-white rounded-xl flex items-center justify-center flex-col shrink-0">
                            <span className="text-[10px] font-bold opacity-80 uppercase leading-none mb-1">Token</span>
                            <span className="text-xl font-black leading-none">{apt.token.replace('T-', '')}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-brand-teal" />
                                <span className="text-xs font-bold text-text-main">{apt.date} • {apt.timeSlot}</span>
                            </div>
                            <h3 className="text-sm font-bold text-text-main">
                                {apt.patientName || `Patient UID: ${apt.userId.substring(0, 5)}...`}
                            </h3>
                            {apt.phone && <span className="text-[11px] text-text-muted">{apt.phone}</span>}
                            <div className="mt-1.5">
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-600">
                                    {apt.status === 'upcoming' ? 'WAITING' : apt.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
