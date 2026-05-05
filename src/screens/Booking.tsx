import { ArrowLeft, Star, Zap } from 'lucide-react';
import { GoToType, BookingInfo } from '../types';
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, setDoc, serverTimestamp, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export function Booking({ 
  goTo, 
  doctorId,
  onBook,
  doctors
}: { 
  goTo: GoToType, 
  doctorId: string | null,
  onBook: (booking: BookingInfo, selectedDateId: string) => void,
  doctors: any[]
}) {
  const doctor = doctors.find(d => d.id === doctorId) || doctors[0];
  
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        // format to local time to prevent offset issues
        const dateStr = d.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
        let label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (i === 0) label = `Aaj, ${label}`;
        else if (i === 1) label = `Kal, ${label}`;
        dates.push({ date: dateStr, label });
    }
    return dates;
  };

  const datesList = generateDates();
  
  const [selectedDate, setSelectedDate] = useState<string>(datesList[0].date);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookedSlotsDict, setBookedSlotsDict] = useState<Record<string, boolean>>({});
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualDate, setManualDate] = useState<string>('');
  const [manualTime, setManualTime] = useState<string>('');

  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);

  useEffect(() => {
    if (!doctorId || !selectedDate) return;
    const fetchSlots = async () => {
       try {
         const q = query(collection(db, 'doctors', doctorId, 'bookedSlots'));
         const snap = await getDocs(q);
         const dict: Record<string, boolean> = {};
         snap.docs.forEach(docSnap => {
            const [datePart, timePart] = docSnap.id.split('_');
            if (datePart === selectedDate) {
               dict[timePart] = true;
            }
         });
         setBookedSlotsDict(dict);
       } catch (error) {
         console.error("Error fetching slots", error);
       }
    };
    fetchSlots();
  }, [doctorId, selectedDate]);

  useEffect(() => {
    if (!doctorId) return;
    const q = query(collection(db, 'doctors', doctorId, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);
    });
    return () => unsub();
  }, [doctorId]);

  const handleAddReview = async () => {
    if (!auth.currentUser) {
        alert("Please login to review");
        return;
    }
    if (reviews.some(r => r.userId === auth.currentUser?.uid)) {
        alert("You have already reviewed this doctor.");
        return;
    }
    if (newRating === 0) {
        alert("Please select a rating");
        return;
    }
    setIsSubmittingReview(true);
    try {
        await setDoc(doc(db, 'doctors', doctorId, 'reviews', auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Anonymous',
            rating: newRating,
            comment: newComment,
            createdAt: serverTimestamp()
        });

        // Update the doctor's average rating
        const currentReviews = doctor.reviews || 0;
        const currentRating = doctor.rating || 0;
        const totalRating = (currentRating * currentReviews) + newRating;
        const newReviewsCount = currentReviews + 1;
        const newAverageRating = Number((totalRating / newReviewsCount).toFixed(1));

        await updateDoc(doc(db, 'doctors', doctorId), {
            rating: newAverageRating,
            reviews: newReviewsCount
        });

        setNewRating(0);
        setNewComment('');
        alert("Review added successfully");
    } catch (e) {
        console.error("Error adding review", e);
        alert("Error adding review");
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!auth.currentUser) return;
    if (newRating === 0) {
        alert("Please select a rating");
        return;
    }
    const userReview = reviews.find(r => r.userId === auth.currentUser?.uid);
    if (!userReview) return;

    setIsSubmittingReview(true);
    try {
        await updateDoc(doc(db, 'doctors', doctorId, 'reviews', auth.currentUser.uid), {
            rating: newRating,
            comment: newComment,
            updatedAt: serverTimestamp()
        });

        const currentReviews = doctor.reviews || 0;
        const currentRating = doctor.rating || 0;
        const oldRating = userReview.rating;
        const totalRating = (currentRating * currentReviews) - oldRating + newRating;
        const newAverageRating = currentReviews === 0 ? newRating : Number((totalRating / currentReviews).toFixed(1));

        await updateDoc(doc(db, 'doctors', doctorId), {
            rating: newAverageRating
        });

        setIsEditingReview(false);
        setNewRating(0);
        setNewComment('');
        alert("Review updated successfully");
    } catch (e) {
        console.error("Error updating review", e);
        alert("Error updating review");
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!auth.currentUser) return;
    const userReview = reviews.find(r => r.userId === auth.currentUser?.uid);
    if (!userReview) return;
    
    if (!confirm("Are you sure you want to delete this review?")) return;

    setIsSubmittingReview(true);
    try {
        await deleteDoc(doc(db, 'doctors', doctorId, 'reviews', auth.currentUser.uid));

        const currentReviews = doctor.reviews || 0;
        const currentRating = doctor.rating || 0;
        const oldRating = userReview.rating;
        const totalRating = (currentRating * currentReviews) - oldRating;
        const newReviewsCount = Math.max(0, currentReviews - 1);
        const newAverageRating = newReviewsCount === 0 ? 0 : Number((totalRating / newReviewsCount).toFixed(1));

        await updateDoc(doc(db, 'doctors', doctorId), {
            rating: newAverageRating,
            reviews: newReviewsCount
        });

        setIsEditingReview(false);
        setNewRating(0);
        setNewComment('');
        alert("Review deleted successfully");
    } catch (e) {
        console.error("Error deleting review", e);
        alert("Error deleting review");
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const startTime = doctor.startTime || '09:00';
  const endTime = doctor.endTime || '17:00';

  const generateTimeSlots = () => {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let currentH = startH;
    let currentM = startM;

    const now = new Date();
    // Compare YYYY-MM-DD
    const isToday = selectedDate === now.toLocaleDateString('en-CA');
    const actualCurrentH = now.getHours();
    const actualCurrentM = now.getMinutes();

    while (currentH < endH || (currentH === endH && currentM < endM)) {
      const ampm = currentH >= 12 ? 'PM' : 'AM';
      let displayH = currentH % 12;
      displayH = displayH ? displayH : 12;
      const displayM = currentM === 0 ? '00' : currentM.toString().padStart(2, '0');
      const timeStr = `${displayH}:${displayM} ${ampm}`;
      
      let isPast = false;
      if (isToday) {
        if (actualCurrentH > currentH || (actualCurrentH === currentH && actualCurrentM > currentM)) {
          isPast = true;
        }
      }

      slots.push({ time: timeStr, isPast });

      currentM += 30;
      if (currentM >= 60) {
        currentH += 1;
        currentM -= 60;
      }
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  const selectedDateLabel = datesList.find(d => d.date === selectedDate)?.label || selectedDate;

  const handleBook = () => {
    if (isManualMode) {
      if (!manualDate || !manualTime || !patientName.trim() || !phone.trim()) {
        alert('Kripya apna naam, phone number, manual date aur time chunein.');
        return;
      }
    } else {
      if (!selectedSlot || !patientName.trim() || !phone.trim()) {
        alert('Kripya apna naam, phone number aur time slot chunein.');
        return;
      }
    }

    const tempToken = `T-XX`;
    
    let finalDateLabel = selectedDateLabel;
    let finalDateId = selectedDate;
    let finalSlot = selectedSlot!;

    if (isManualMode) {
      finalDateLabel = new Date(manualDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      finalDateId = manualDate;
      
      const [h, m] = manualTime.split(':');
      let hourNum = parseInt(h);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      hourNum = hourNum % 12;
      hourNum = hourNum ? hourNum : 12;
      finalSlot = `${hourNum}:${m} ${ampm}`;
    }

    const newBooking: BookingInfo = {
      id: crypto.randomUUID(),
      token: tempToken,
      patientName,
      phone,
      doctorId: doctor.id,
      date: finalDateLabel,
      rawDate: finalDateId,
      timeSlot: finalSlot
    };

    onBook(newBooking, finalDateId);
    goTo('confirm');
  };

  const userReview = auth.currentUser ? reviews.find(r => r.userId === auth.currentUser.uid) : null;

  return (
    <div className="pb-10 bg-white min-h-full">
      <div className="bg-white px-5 pt-12 pb-4 border-b border-slate-100">
        <button onClick={() => goTo('doctors', true)} className="flex items-center gap-1.5 text-text-muted text-sm font-semibold mb-4 active:opacity-70 transition-opacity">
          <ArrowLeft className="w-4 h-4" /> Wapas
        </button>
        <div className="flex items-center gap-3.5">
          {doctor.avatarUrl ? (
              <div className="relative w-[72px] h-[72px] rounded-[20px] overflow-hidden shrink-0">
                  <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-full object-cover" />
              </div>
          ) : (
              <div className={`w-[72px] h-[72px] ${doctor.avatarBg || 'bg-brand-blue-light'} rounded-[20px] flex items-center justify-center shrink-0 text-[36px] leading-[1]`}>
                 {doctor.avatarEmoji ? doctor.avatarEmoji : '👨‍⚕️'}
              </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-text-main font-nunito">{doctor.name}</h1>
            <p className="text-xs text-text-muted mt-0.5">{doctor.qualifications}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {doctor.hospitalPhotoUrl && (
                  <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                      <img src={doctor.hospitalPhotoUrl} alt="clinic" className="w-full h-full object-cover" />
                  </div>
              )}
              <p className="text-xs text-brand-teal font-semibold">{doctor.hospitalType === 'Hospital' ? '🏥' : '🩺'} {doctor.hospital}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                <Star className="w-3 h-3 fill-current" /> {doctor.rating}
              </span>
              <span className="text-[11px] text-text-muted">({doctor.reviews} reviews)</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-blue-light text-brand-blue ml-1">&#8377;{doctor.fees} fees</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="bg-brand-teal-light border border-brand-teal/20 rounded-2xl p-3 flex gap-3 items-center mb-4">
          <Zap className="w-6 h-6 fill-amber-400 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-brand-teal">Line mein khadaa hona nahi!</h4>
            <p className="text-[11px] text-[#3d7a6c] mt-0.5 max-w-[200px]">Token lein, ghar se aayein sahi time par</p>
          </div>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
          <button 
            onClick={() => setIsManualMode(false)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${!isManualMode ? 'bg-white shadow-sm text-brand-teal' : 'text-text-muted hover:text-text-main'}`}
          >
            Auto Slots
          </button>
          <button 
            onClick={() => setIsManualMode(true)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${isManualMode ? 'bg-white shadow-sm text-brand-teal' : 'text-text-muted hover:text-text-main'}`}
          >
            Manual Book
          </button>
        </div>

        {!isManualMode ? (
          <>
            <h2 className="text-base font-bold text-text-main font-nunito mb-3">Kab dikhana hai?</h2>
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide">
              {datesList.map(item => (
                <button
                  key={item.date}
                  onClick={() => {
                    setSelectedDate(item.date);
                    setSelectedSlot(null);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2
                    ${selectedDate === item.date ? 'bg-brand-teal-light border-brand-teal text-brand-teal' : 'bg-white border-slate-200 text-text-main active:scale-95'}
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <h2 className="text-base font-bold text-text-main font-nunito mb-3 mt-2">Available Slots</h2>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot, i) => {
                const isBooked = bookedSlotsDict[slot.time] || false;
                const disabled = isBooked || slot.isPast;
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`p-2 rounded-xl text-[11px] font-semibold text-center transition-all border-2 flex flex-col items-center justify-center min-h-[44px]
                      ${disabled 
                        ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed' 
                        : slot.time === selectedSlot
                          ? 'bg-brand-teal-light border-brand-teal text-brand-teal'
                          : 'bg-white border-slate-100 text-[#3d4a5c] active:scale-95 shadow-sm'
                      }
                    `}
                  >
                    <span>{slot.time}</span>
                    {disabled && (
                      <span className="text-[9px] mt-0.5 opacity-70 font-medium">
                        {isBooked ? 'Booked' : 'Time Passed'}
                      </span>
                    )}
                  </button>
                );
              })}
              {timeSlots.length === 0 && (
                <div className="col-span-3 text-center text-sm text-text-muted py-4">No slots available.</div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-text-main font-nunito mb-1">Manual Date & Time</h2>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Date</label>
              <input 
                type="date" 
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-white border-[1.5px] border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-brand-teal transition-colors" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Time</label>
              <input 
                type="time" 
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                className="w-full bg-white border-[1.5px] border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-brand-teal transition-colors" 
              />
            </div>
          </div>
        )}

        <div className="mt-6 mb-2.5 text-base font-bold text-text-main font-nunito">Aapka Naam</div>
        <input 
          type="text" 
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Jaise: Rahul Gupta" 
          className="w-full bg-white border-[1.5px] border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-brand-teal transition-colors mb-2.5 placeholder:text-slate-400 font-sans" 
        />
        <input 
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number" 
          className="w-full bg-white border-[1.5px] border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-brand-teal transition-colors mb-3 placeholder:text-slate-400 font-sans" 
        />

        <div className="bg-slate-50 rounded-2xl p-4 my-4 text-[13px] font-medium space-y-2.5 border border-slate-100">
          <div className="flex justify-between text-text-main"><span className="text-text-muted">Doctor fees</span>&#8377;{doctor.fees}</div>
          <div className="flex justify-between text-text-main">
            <span className="text-text-muted">Platform charge</span>
            <span>&#8377;0 <span className="text-[10px] text-brand-teal font-bold py-0.5 px-1.5 bg-brand-teal-light rounded-md">FREE</span></span>
          </div>
          <div className="flex justify-between text-text-main font-bold border-t border-slate-200 pt-3 mt-1">
            <span>Total (clinic pe dein)</span><span className="text-brand-teal text-sm">&#8377;{doctor.fees}</span>
          </div>
        </div>

        <button 
          onClick={handleBook}
          className="w-full bg-gradient-to-br from-brand-blue to-brand-teal text-white rounded-xl py-4 font-bold font-nunito text-base shadow-md shadow-brand-teal/20 active:scale-[0.98] transition-transform mb-8"
        >
          Token Book Karein 🎫
        </button>

        <hr className="my-8 border-slate-200" />
        
        <h2 className="text-base font-bold text-text-main font-nunito mb-4">Patient Reviews</h2>
        
        {/* Write / Edit review form */}
        {userReview && !isEditingReview ? (
            <div className="bg-brand-blue-light/30 p-4 rounded-xl mb-6 border border-brand-blue/20">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-text-main">Your Review</span>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                setNewRating(userReview.rating);
                                setNewComment(userReview.comment || '');
                                setIsEditingReview(true);
                            }}
                            className="text-xs font-bold text-brand-teal active:opacity-70"
                        >
                            Edit
                        </button>
                        <button 
                            disabled={isSubmittingReview}
                            onClick={handleDeleteReview}
                            className="text-xs font-bold text-red-500 active:opacity-70"
                        >
                            Delete
                        </button>
                    </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${userReview.rating >= star ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />
                    ))}
                </div>
                {userReview.comment && (
                    <p className="text-[13px] text-text-main">{userReview.comment}</p>
                )}
            </div>
        ) : (
        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
            <h3 className="text-sm font-bold text-text-main mb-2">{isEditingReview ? 'Edit Your Review' : 'Write a Review'}</h3>
            <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                    <button 
                       key={star} 
                       onClick={() => setNewRating(star)}
                       className="p-1 -ml-1"
                    >
                        <Star className={`w-6 h-6 ${newRating >= star ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                ))}
            </div>
            <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your experience (optional)..."
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-brand-teal resize-none h-20 mb-3"
            />
            <div className="flex gap-2">
                <button 
                    disabled={isSubmittingReview}
                    onClick={isEditingReview ? handleUpdateReview : handleAddReview}
                    className="bg-brand-teal text-white px-4 py-2 rounded-lg text-sm font-bold active:scale-95 transition-transform"
                >
                    {isSubmittingReview ? "Saving..." : "Submit Review"}
                </button>
                {isEditingReview && (
                    <button 
                        disabled={isSubmittingReview}
                        onClick={() => setIsEditingReview(false)}
                        className="bg-slate-200 text-text-main px-4 py-2 rounded-lg text-sm font-bold active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
        )}

        {/* Existing reviews */}
        <div className="space-y-4">
            {reviews.filter(r => r.userId !== auth.currentUser?.uid).length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No other reviews yet.</p>
            ) : (
                reviews.filter(r => r.userId !== auth.currentUser?.uid).map(review => (
                    <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-text-main">{review.userName}</span>
                            <span className="text-xs text-text-muted">
                                {review.updatedAt?.toDate ? new Date(review.updatedAt.toDate()).toLocaleDateString() : review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : ''}
                            </span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                           {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />
                           ))}
                        </div>
                        {review.comment && (
                            <p className="text-[13px] text-text-muted">{review.comment}</p>
                        )}
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
