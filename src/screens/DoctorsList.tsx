import { ArrowLeft, Star, Search as SearchIcon, X } from 'lucide-react';
import { GoToType } from '../types';
import { DOCTORS } from '../data';
import { useState } from 'react';

export function DoctorsList({ 
  goTo, 
  onSelectDoctor,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  doctors
}: { 
  goTo: GoToType, 
  onSelectDoctor: (doctorId: string) => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  activeFilter: string,
  setActiveFilter: (f: string) => void,
  doctors: any[]
}) {
  const filters = ['Sab', 'General', 'Cardiologist', 'Dentist', 'Paediatrician'];

  const filteredDoctors = doctors.filter(doc => {
    const matchesCategory = activeFilter === 'Sab' || doc.categories.includes(activeFilter);
    const lowerQuery = searchQuery.toLowerCase();
    const matchesQuery = 
      doc.name.toLowerCase().includes(lowerQuery) || 
      doc.hospital.toLowerCase().includes(lowerQuery) || 
      doc.qualifications.toLowerCase().includes(lowerQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="pb-6">
      <div className="bg-gradient-to-br from-brand-teal to-brand-blue px-5 pt-12 pb-5 rounded-b-[24px]">
        <button onClick={() => goTo('home', true)} className="flex items-center gap-1.5 text-white text-sm font-semibold mb-3 active:opacity-70 transition-opacity">
          <ArrowLeft className="w-4 h-4" /> Wapas jaao
        </button>
        <h1 className="text-white text-lg font-bold font-nunito mb-3">Doctors — New Delhi</h1>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Doctor, hospital..." 
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl py-2 pl-9 pr-8 outline-none text-sm placeholder:text-white/60 focus:bg-white/20 transition-colors"
          />
          <SearchIcon className="w-4 h-4 text-white/60 absolute left-3 top-2.5" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 opacity-60 hover:opacity-100">
               <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
          {filters.map((f, i) => {
            const isActive = activeFilter === f;
            return (
              <button 
                key={i} 
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full transition-colors ${isActive ? 'bg-white text-brand-teal' : 'bg-white/20 text-white active:bg-white/30'}`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-4">
        <p className="text-xs text-text-muted font-medium mb-3">{filteredDoctors.length} doctors mile aapke paas</p>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-10 opacity-60">
            <p className="text-sm font-bold text-text-main">Koi doctor nahi mila.</p>
            <p className="text-xs mt-1">Kuch aur search karein.</p>
          </div>
        )}

        {filteredDoctors.map((doc) => (
          <div 
            key={doc.id} 
            onClick={() => {
              onSelectDoctor(doc.id);
              goTo('booking');
            }} 
            className="bg-white rounded-[20px] p-4 shadow-sm mb-3 active:scale-95 transition-all outline outline-2 outline-transparent hover:outline-brand-teal-light cursor-pointer"
          >
            <div className="flex gap-3 items-start">
              {doc.avatarUrl ? (
                  <div className="relative w-[60px] h-[60px] rounded-[16px] overflow-hidden shrink-0">
                      <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                  </div>
              ) : (
                  <div className={`w-[60px] h-[60px] ${doc.avatarBg || 'bg-brand-blue-light'} rounded-[16px] flex items-center justify-center shrink-0 text-[28px] leading-none`}>
                     {doc.avatarEmoji ? doc.avatarEmoji : '👨‍⚕️'}
                  </div>
              )}
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-text-main font-nunito">{doc.name}</h3>
                <p className="text-[11px] text-text-muted mt-0.5">{doc.qualifications}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {doc.hospitalPhotoUrl && (
                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                          <img src={doc.hospitalPhotoUrl} alt="clinic" className="w-full h-full object-cover" />
                      </div>
                  )}
                  <p className="text-[11px] text-text-muted">{doc.hospitalType === 'Hospital' ? '🏥' : '🩺'} {doc.hospital}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${doc.availBg || 'bg-brand-teal-light'} ${doc.availText || 'text-brand-teal'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" /> {doc.availableMsg}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                    <Star className="w-3 h-3 fill-current" /> {doc.rating} ({doc.reviews})
                  </span>
                  <span className="text-[10px] font-semibold text-brand-blue opacity-90">&#8377;{doc.fees} fees</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-xl ${doc.isAvailable ? 'bg-brand-teal-light text-brand-teal' : 'bg-brand-amber text-brand-amber-text'}`}>
                {doc.slots}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-xl bg-brand-blue-light text-brand-blue">{doc.wait}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
