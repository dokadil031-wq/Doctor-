import { ArrowLeft, Check, Camera, Plus, Trash2, User } from 'lucide-react';
import { GoToType } from '../types';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface DoctorInput {
  doctorName: string;
  speciality: string;
  fees: string;
  startTime: string;
  endTime: string;
  photoUrl: string;
}

export function Register({ goTo }: { goTo: GoToType }) {
  const [loading, setLoading] = useState(false);
  const [facilityType, setFacilityType] = useState<'Clinic' | 'Hospital'>('Clinic');
  const [facilityName, setFacilityName] = useState('');
  const [facilityPhotoUrl, setFacilityPhotoUrl] = useState('');
  const [address, setAddress] = useState('');

  const [doctorsInputs, setDoctorsInputs] = useState<DoctorInput[]>([
    { doctorName: '', speciality: '', fees: '', startTime: '', endTime: '', photoUrl: '' }
  ]);

  const features = [
    'Unlimited patient tokens per day',
    'SMS/WhatsApp alerts to patients',
    'Live queue management dashboard',
    'Google Maps location listing',
    'Patient reviews & ratings',
    '24/7 technical support'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) { // 1MB limit for firestore base64 to avoid huge docs
          alert("Image size should be less than 1MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async () => {
    if (!facilityName || !address) {
      alert('Kripya facility ka naam aur address bharein.');
      return;
    }
    
    for (let i = 0; i < doctorsInputs.length; i++) {
        const doc = doctorsInputs[i];
        if (!doc.doctorName || !doc.fees || !doc.startTime || !doc.endTime) {
            alert(`Doctor ${i + 1} ka naam, fees aur time zarur bharein.`);
            return;
        }
    }

    const formatTime = (timeStr: string) => {
      if(!timeStr) return '';
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12; 
      return `${hour}:${m} ${ampm}`;
    };

    setLoading(true);
    try {
      // Add each doctor as a separate document
      for (const docInput of doctorsInputs) {
          await addDoc(collection(db, 'doctors'), {
            creatorId: auth.currentUser?.uid || null,
            name: docInput.doctorName,
            hospital: facilityName,
            hospitalType: facilityType,
            hospitalPhotoUrl: facilityPhotoUrl,
            address: address,
            qualifications: docInput.speciality || 'MBBS',
            fees: parseInt(docInput.fees) || 500,
            startTime: docInput.startTime,
            endTime: docInput.endTime,
            avatarUrl: docInput.photoUrl,
            rating: 5.0,
            reviews: 0,
            wait: '~ 15 mins',
            slots: `${formatTime(docInput.startTime)} - ${formatTime(docInput.endTime)}`,
            availableMsg: 'Available Today',
            isAvailable: true,
            avatarBg: 'bg-indigo-100',
            avatarEmoji: '👨‍⚕️',
            categories: [docInput.speciality || 'General']
          });
      }
      alert('Registration successful! Aapka clinic/hospital add ho gaya hai.');
      goTo('dashboard');
    } catch (e) {
      console.error(e);
      alert('Error registering clinic.');
    } finally {
      setLoading(false);
    }
  };

  const updateDoctor = (index: number, field: keyof DoctorInput, value: string) => {
      const newDocs = [...doctorsInputs];
      newDocs[index][field] = value;
      setDoctorsInputs(newDocs);
  };

  return (
    <div className="pb-10 bg-[#f5f7fa] min-h-screen">
      <div className="bg-gradient-to-br from-brand-blue to-brand-teal px-5 pt-12 pb-7 rounded-b-[28px]">
        <button onClick={() => goTo('profile', true)} className="flex items-center gap-1.5 text-white text-sm font-semibold mb-3 active:opacity-70 transition-opacity">
          <ArrowLeft className="w-4 h-4" /> Wapas
        </button>
        <h1 className="text-white text-lg font-extrabold font-nunito">Doctor/Clinic Register</h1>
        <p className="text-white/80 text-xs mt-1 font-medium">Apna clinic DocQ par add karein</p>
      </div>

      <div className="px-5 pt-4">
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(10,110,92,0.15)] border-2 border-brand-teal mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[13px] font-bold text-brand-teal mb-1">DocQ Pro Plan</div>
              <div className="text-[32px] font-black text-brand-teal font-nunito leading-none flex items-center gap-2">
                <span className="line-through text-slate-400 text-2xl">&#8377;499</span> Free
              </div>
              <div className="text-xs text-text-muted font-medium mt-1">Limited time offer!</div>
            </div>
            <div className="bg-brand-teal text-white text-[10px] font-bold px-2.5 py-1 rounded-full">POPULAR</div>
          </div>
          
          <div className="space-y-0.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0 text-[13px] text-text-main font-medium">
                <div className="w-5 h-5 rounded-full bg-brand-teal-light text-brand-teal flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-5 mt-2 text-sm">
          {/* Facility Details */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <h2 className="font-bold text-brand-blue mb-3">Facility Details</h2>
              
              <div className="flex gap-3 mb-3">
                  <button 
                      onClick={() => setFacilityType('Clinic')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${facilityType === 'Clinic' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                      Clinic
                  </button>
                  <button 
                      onClick={() => setFacilityType('Hospital')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${facilityType === 'Hospital' ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                      Hospital
                  </button>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-bold text-text-muted mb-1.5">{facilityType} Name *</label>
                <input value={facilityName} onChange={e => setFacilityName(e.target.value)} placeholder={`E.g. Apollo ${facilityType}`} className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans placeholder:text-slate-400" />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-bold text-text-muted mb-1.5">{facilityType} Photo</label>
                <div className="flex items-center gap-3">
                    {facilityPhotoUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                            <img src={facilityPhotoUrl} alt="Facility" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Camera className="w-6 h-6 text-slate-400" />
                        </div>
                    )}
                    <label className="bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-text-main cursor-pointer active:scale-95">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, setFacilityPhotoUrl)} />
                        Upload Photo
                    </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5">Address *</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans placeholder:text-slate-400" />
              </div>
          </div>

          {/* Doctors Details */}
          {doctorsInputs.map((doc, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative">
                  {doctorsInputs.length > 1 && (
                      <button onClick={() => setDoctorsInputs(prev => prev.filter((_, i) => i !== index))} className="absolute top-4 right-4 text-red-500 p-1">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  )}
                  <h2 className="font-bold text-brand-blue mb-3">Doctor {index + 1}</h2>
                  
                  <div className="mb-3">
                      <label className="block text-xs font-bold text-text-muted mb-1.5">Doctor Name *</label>
                      <input value={doc.doctorName} onChange={e => updateDoctor(index, 'doctorName', e.target.value)} placeholder="E.g. Dr. Mohan Sharma" className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans placeholder:text-slate-400" />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Doctor Photo</label>
                    <div className="flex items-center gap-3">
                        {doc.photoUrl ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                                <img src={doc.photoUrl} alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                        )}
                        <label className="bg-slate-100 px-3 py-2 rounded-lg text-xs font-bold text-text-main cursor-pointer active:scale-95">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, (url) => updateDoctor(index, 'photoUrl', url))} />
                            Upload Photo
                        </label>
                    </div>
                  </div>

                  <div className="mb-3">
                      <label className="block text-xs font-bold text-text-muted mb-1.5">Speciality *</label>
                      <input value={doc.speciality} onChange={e => updateDoctor(index, 'speciality', e.target.value)} placeholder="General Physician, Dentist..." className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans placeholder:text-slate-400" />
                  </div>
                  
                  <div className="mb-3">
                      <label className="block text-xs font-bold text-text-muted mb-1.5">Consultation Fees (&#8377;) *</label>
                      <input value={doc.fees} onChange={e => updateDoctor(index, 'fees', e.target.value)} type="number" placeholder="500" className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans placeholder:text-slate-400" />
                  </div>
                  
                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-text-muted mb-1.5">Start Time *</label>
                          <input value={doc.startTime} onChange={e => updateDoctor(index, 'startTime', e.target.value)} type="time" className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans text-sm" />
                      </div>
                      <div className="flex-1">
                          <label className="block text-xs font-bold text-text-muted mb-1.5">End Time *</label>
                          <input value={doc.endTime} onChange={e => updateDoctor(index, 'endTime', e.target.value)} type="time" className="w-full bg-slate-50 border-[1.5px] border-slate-200 rounded-xl p-3 outline-none focus:border-brand-teal transition-colors font-sans text-sm" />
                      </div>
                  </div>
              </div>
          ))}

          <button 
              onClick={() => setDoctorsInputs([...doctorsInputs, { doctorName: '', speciality: '', fees: '', startTime: '', endTime: '', photoUrl: '' }])}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-brand-teal font-bold text-sm flex items-center justify-center gap-2 active:bg-slate-50"
          >
              <Plus className="w-4 h-4" /> Add Another Doctor
          </button>
        </div>

        <button 
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl py-4 font-bold font-nunito text-base shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-transform disabled:opacity-75"
        >
          {loading ? 'Processing...' : 'Abhi Free Me Register Karein 🚀'}
        </button>
        <p className="text-center text-[11px] text-text-muted font-medium mt-3">
          DocQ Pro Subscription abhi ke liye free hai!
        </p>
      </div>
    </div>
  );
}
