import { Ticket, Calendar, Clock, MapPin } from 'lucide-react';
import { GoToType, BookingInfo } from '../types';
import { DOCTORS } from '../data';

export function Tickets({ goTo, bookings, onSelectTicket, doctors }: { goTo: GoToType, bookings: BookingInfo[], onSelectTicket: (id: string) => void, doctors: any[] }) {
  return (
    <div className="pb-24 bg-[#f5f7fa] min-h-full">
      <div className="bg-white px-5 pt-14 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-text-main font-nunito flex items-center gap-2">
          <Ticket className="w-6 h-6 text-brand-teal" /> Mere Tickets
        </h1>
      </div>
      
      <div className="px-5 pt-5 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center text-text-muted mt-14">
            <Ticket className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Aapne abhi koi appointment book nahi ki hai.</p>
            <button 
              onClick={() => goTo('doctors')} 
              className="mt-5 text-brand-teal font-bold bg-brand-teal-light px-5 py-2.5 rounded-full"
            >
              Doctor Dhundhein
            </button>
          </div>
        ) : (
          bookings.map(booking => {
            const doc = doctors.find(d => d.id === booking.doctorId);
            if (!doc) return null;

            let isExpired = false;
            const now = new Date();
            const currentDate = now.toLocaleDateString('en-CA');
            const currentH = now.getHours();
            const currentM = now.getMinutes();
            const endTimeStr = doc.endTime || '17:00';
            const [endH, endM] = endTimeStr.split(':').map(Number);

            if (booking.rawDate) {
               if (booking.rawDate < currentDate) {
                 isExpired = true;
               } else if (booking.rawDate === currentDate) {
                 if (currentH > endH || (currentH === endH && currentM >= endM)) {
                   isExpired = true;
                 }
               }
            } else if (booking.createdAt) {
               const createdDateStr = new Date(booking.createdAt).toLocaleDateString('en-CA');
               if (createdDateStr < currentDate) {
                 isExpired = true;
               } else if (createdDateStr === currentDate) {
                 if (currentH > endH || (currentH === endH && currentM >= endM)) {
                   isExpired = true;
                 }
               }
            }

            return (
              <div 
                key={booking.id} 
                onClick={() => {
                  onSelectTicket(booking.id);
                  goTo('confirm');
                }}
                className={`bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 active:scale-95 transition-transform cursor-pointer relative overflow-hidden ${isExpired ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isExpired ? 'bg-slate-300' : 'bg-brand-teal'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-text-muted tracking-wider uppercase mb-1">Token Number</h3>
                    <div className={`text-2xl font-black font-nunito ${isExpired ? 'text-slate-500' : 'text-brand-teal'}`}>{booking.token}</div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${isExpired ? 'bg-slate-100 text-slate-500' : 'bg-brand-teal-light text-brand-teal'}`}>
                    {isExpired ? 'Expired' : 'Upcoming'}
                  </div>
                </div>

                <h4 className="font-bold text-text-main text-sm">{doc.name}</h4>
                <div className="flex items-center gap-1.5 mb-3">
                  {doc.hospitalPhotoUrl && (
                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                          <img src={doc.hospitalPhotoUrl} alt="clinic" className="w-full h-full object-cover" />
                      </div>
                  )}
                  <p className="text-[11px] text-text-muted">{doc.hospitalType === 'Hospital' ? '🏥' : '🩺'} {doc.hospital}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-main bg-slate-50 px-2 py-1 rounded-md flex-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-teal" /> {booking.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-main bg-slate-50 px-2 py-1 rounded-md flex-1">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" /> {booking.timeSlot}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
