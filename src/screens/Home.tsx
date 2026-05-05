import React, { useState } from 'react';
import { MapPin, Search as SearchIcon, Star, X } from 'lucide-react';
import { GoToType } from '../types';
import { DOCTORS } from '../data';
import { AnimatePresence, motion } from 'motion/react';

export function Home({ goTo, searchQuery, setSearchQuery, setActiveFilter, onSelectDoctor, userLocation, setUserLocation, doctors }: { goTo: GoToType, searchQuery: string, setSearchQuery: (q: string) => void, setActiveFilter: (f: string) => void, onSelectDoctor: (id: string) => void, userLocation: string, setUserLocation: (u: string) => void, doctors: any[] }) {
  const [modalContent, setModalContent] = useState<{title: string, message: string} | null>(null);

  const specs = [
    { icon: '🫀', label: 'Cardio' },
    { icon: '🦷', label: 'Dentist' },
    { icon: '👶', label: 'Paedi' },
    { icon: '🧠', label: 'Neuro' },
    { icon: '👁️', label: 'Eye' },
    { icon: '🦴', label: 'Ortho' },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      goTo('doctors');
    }
  };

  const handleCategoryClick = (category: string) => {
    // Map home page categories to filters in DoctorsList
    let filterTarget = 'Sab';
    if (category === 'Cardio') filterTarget = 'Cardiologist';
    if (category === 'Dentist') filterTarget = 'Dentist';
    if (category === 'Paedi') filterTarget = 'Paediatrician';
    if (category === 'Neuro') filterTarget = 'Neuro'; // Ensure Neuro category exists or default
    if (category === 'Eye') filterTarget = 'Eye';
    if (category === 'Ortho') filterTarget = 'Ortho';

    setActiveFilter(filterTarget);
    goTo('doctors');
  };

  const handleLocationClick = () => {
    const loc = prompt('Aapni location type karein:', userLocation);
    if (loc && loc.trim() !== '') {
      setUserLocation(loc.trim());
    }
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-blue to-brand-teal px-5 pt-12 pb-7 rounded-b-[28px]">
        <div 
          onClick={handleLocationClick}
          className="flex items-center gap-1.5 text-white/75 text-xs mb-1 cursor-pointer active:opacity-70 transition-opacity"
        >
          <MapPin className="w-3.5 h-3.5" /> {userLocation}
        </div>
        <div className="text-white text-2xl font-bold font-nunito leading-tight mb-5">
          Namaskar! 👋<br />
          <span className="text-[#7fffd4]">Doctor dhundhe</span> aas paas
        </div>
        
        <div 
          onClick={() => goTo('doctors')}
          className="relative cursor-pointer"
        >
          <div className="w-full bg-white rounded-2xl py-3.5 pl-11 pr-4 shadow-lg shadow-black/10 text-sm text-slate-400 font-sans text-left flex items-center">
             {searchQuery ? (
               <span className="text-text-main">{searchQuery}</span>
             ) : (
               "Doctor, hospital, speciality..."
             )}
          </div>
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
        </div>
      </div>


      {/* Speciality */}
      <div className="px-5 pt-6">
        <div className="mb-3">
          <h2 className="text-base font-bold text-text-main font-nunito">Speciality</h2>
          <p className="text-xs text-text-muted">Apni zaroorat chuniye</p>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {specs.map((s, i) => {
            return (
              <div 
                key={i} 
                onClick={() => handleCategoryClick(s.label)}
                className="flex-shrink-0 bg-white rounded-2xl p-3 flex flex-col items-center gap-2 min-w-[76px] shadow-sm active:scale-95 transition-all border-2 border-transparent focus:border-brand-teal cursor-pointer"
              >
                <div className="text-2xl leading-none">{s.icon}</div>
                <span className="text-[10px] font-semibold text-slate-700">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospitals */}
      <div className="px-5 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-text-main font-nunito">Paas ke Doctors & Clinics</h2>
          <button onClick={() => goTo('doctors')} className="text-xs font-semibold text-brand-teal">Sab dekho &rarr;</button>
        </div>

        <div className="flex flex-col gap-3">
          {doctors.slice(0, 3).map((doc) => (
            <div 
              key={doc.id}
              onClick={() => {
                onSelectDoctor(doc.id);
                goTo('booking');
              }} 
              className="bg-white rounded-[18px] p-3.5 flex gap-3 shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              {doc.avatarUrl ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                      <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                  </div>
              ) : (
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${doc.avatarBg || 'bg-brand-blue-light'} text-2xl`}>
                    {doc.avatarEmoji ? doc.avatarEmoji : '👨‍⚕️'}
                  </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text-main font-nunito truncate">{doc.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  {doc.hospitalPhotoUrl && (
                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0">
                          <img src={doc.hospitalPhotoUrl} alt="clinic" className="w-full h-full object-cover" />
                      </div>
                  )}
                  <p className="text-[11px] text-text-muted truncate">{doc.hospitalType === 'Hospital' ? '🏥' : '🩺'} {doc.hospital} &bull; {doc.qualifications && doc.qualifications.split ? doc.qualifications.split('•')[0].trim() : doc.qualifications}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-teal-light text-brand-teal">{doc.availableMsg}</span>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
                    <Star className="w-3 h-3 fill-current" /> {doc.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
