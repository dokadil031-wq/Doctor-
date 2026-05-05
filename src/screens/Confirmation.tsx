import { CheckCircle2, Home, Share2, Bell, Clock } from 'lucide-react';
import { GoToType, BookingInfo } from '../types';

export function Confirmation({ goTo, booking, doctors }: { goTo: GoToType, booking: BookingInfo | null, doctors: any[] }) {
  if (!booking) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center bg-[#f5f7fa]">
        <p className="text-text-main font-bold mb-4">No ticket found.</p>
        <button onClick={() => goTo('home', true)} className="bg-brand-teal text-white font-bold px-6 py-3 rounded-xl border border-transparent shadow-sm">Go Home</button>
      </div>
    );
  }

  const doctor = doctors.find(d => d.id === booking.doctorId) || doctors[0];

  let waitText = "N/A";
  let alertTimeStr = "";
  if (booking.rawDate && booking.timeSlot) {
    const [time, ampm] = booking.timeSlot.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const apptDate = new Date(`${booking.rawDate}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
    
    // Alert time is 15 mins before
    const alertTime = new Date(apptDate.getTime() - 15 * 60000);
    alertTimeStr = alertTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

    const now = new Date();
    const diffMs = apptDate.getTime() - now.getTime();
    
    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) {
        waitText = `${diffMins} min`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;
        if (diffHours < 24) {
          waitText = `${diffHours} hr ${remMins} min`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          waitText = `${diffDays} days`;
        }
      }
    } else {
      waitText = "Time pass ho gaya";
    }
  }

  const bookedOnStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : 'N/A';

  return (
    <div className="min-h-full bg-gradient-to-br from-brand-blue to-brand-teal px-6 pt-16 pb-10 flex flex-col items-center overflow-y-auto">
      <div className="text-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-2 opacity-90" />
        <h1 className="text-xl font-black text-white font-nunito">Token Book Ho Gaya!</h1>
        <p className="text-[13px] text-white/80 mt-1">Screenshot le lein ya yaad rakhein</p>
      </div>

      <div className="bg-white rounded-[24px] p-7 w-full shadow-2xl text-center relative overflow-hidden">
        <p className="text-xs font-bold text-text-muted tracking-wider uppercase">Aapka Token Number</p>
        <h2 className="text-[72px] font-black text-brand-teal leading-none my-3 font-nunito">{booking.token}</h2>
        <p className="text-xs text-text-muted">{doctor.name} ke paas</p>

        <hr className="border-t-2 border-dashed border-slate-200 my-6" />

        <div className="space-y-3">
          <div className="flex justify-between text-[13px]"><span className="text-text-muted font-medium">Patient</span><span className="font-bold text-text-main">{booking.patientName}</span></div>
          <div className="flex justify-between text-[13px] items-center text-left">
            <span className="text-text-muted font-medium w-1/2">Booked On</span>
            <span className="font-bold text-text-main text-right text-xs">{bookedOnStr}</span>
          </div>
          <div className="flex justify-between text-[13px]"><span className="text-text-muted font-medium">Appointment Date</span><span className="font-bold text-text-main">{booking.date}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-text-muted font-medium">Appointment Time</span><span className="font-bold text-[#eb5e28]">{booking.timeSlot}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-text-muted font-medium">Hospital</span><span className="font-bold text-text-main">{doctor.hospital}</span></div>
          <div className="flex justify-between items-center"><span className="text-text-muted font-medium text-[13px]">Wait time</span><span className="font-bold text-brand-teal text-[14px]">{waitText}</span></div>
        </div>

        <hr className="border-t-2 border-dashed border-slate-200 my-6" />

        {alertTimeStr ? (
          <div className="flex flex-col gap-1 items-center justify-center text-[11px] font-bold text-brand-blue">
            <div className="flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> SMS Alert will be sent at</div>
            <div className="text-[13px] text-brand-blue/80 bg-brand-blue-light px-2 py-1 rounded-md">{alertTimeStr} (15 mins before)</div>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-1.5 text-[11px] font-bold text-brand-teal">
            <Bell className="w-3.5 h-3.5" /> 15 min pehle SMS alert milega
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full mt-6">
        <button 
          onClick={() => goTo('home', true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-[1.5px] border-white/30 text-white font-bold active:bg-white/10 transition-colors"
        >
          <Home className="w-4 h-4" /> Home
        </button>
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'My Appointment',
                text: `My appointment with ${doctor.name} is confirmed! Token: ${booking.token}`,
              });
            } else {
              alert(`My appointment with ${doctor.name} is confirmed! Token: ${booking.token}\n\n(Share copied to clipboard)`);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-brand-teal font-bold shadow-lg shadow-black/10 active:scale-95 transition-transform"
        >
          <Share2 className="w-4 h-4 text-brand-teal" /> Share
        </button>
      </div>
    </div>
  );
}
