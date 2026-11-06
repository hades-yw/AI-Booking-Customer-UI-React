import { CheckCircle, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { paymentApi } from '../api/httpClient';
import { useBookingAvailability } from '../lib/useBookingAvailability';
import { BookingAvailabilityNotice } from '../components/ui/BookingAvailabilityNotice';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { PageContainer } from '../components/layout/PageContainer';
import { TopNav } from '../components/layout/TopNav';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Row } from '../components/ui/Row';
import { useBookingFlow } from '../context/BookingFlowContext';
import { formatDate } from '../lib/date';
import { formatCurrency } from '../lib/style';
import type { BookingConfirmation } from '../types';

type Option = 'venue' | 'full' | 'deposit';
const labels: Record<Option,string> = {venue:'Pay at venue', full:'Pay in full online', deposit:'Pay a deposit online'};

export function CheckoutPage() {
  const navigate=useNavigate();
  const {merchant,pkg,schedule,customer,paymentMethod,couponCode,quote,clearSavedDraft,reset}=useBookingFlow();
  const availability = useBookingAvailability(merchant?.id);
  const options = availability.options;
  const [option,setOption]=useState<Option>('venue');
  const [email,setEmail]=useState(customer?.email||'');const [submitting,setSubmitting]=useState(false);const [error,setError]=useState('');
  const [confirmation,setConfirmation]=useState<BookingConfirmation|null>(null);const requestKey=useRef('');
  useEffect(()=>{if(options)setOption(options.options.includes('venue')?'venue':options.options[0]||'venue');},[options]);
  if(!merchant||!pkg||!schedule||!customer)return <Navigate to="/" replace/>;
  const total=quote?.totalAmount??pkg.total;
  const dueNow=option==='venue'?0:option==='deposit'?Math.min(total,(options?.deposit_sen||0)/100):total;
  async function submit(){
    if(!availability.available||!merchant||!pkg||!schedule||!customer||!options?.options.includes(option))return;
    setSubmitting(true);setError('');
    try{
      if(dueNow>0&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter your email for the online payment receipt.');
      const fingerprint=JSON.stringify([merchant.id,pkg,schedule,customer.phone,email,option,couponCode]);
      const storageKey='booking-request:'+fingerprint;
      requestKey.current=sessionStorage.getItem(storageKey)||crypto.randomUUID();sessionStorage.setItem(storageKey,requestKey.current);
      const result=await api.createBooking({tenantSlug:merchant.id,tenantTimezone:merchant.timezone??'Asia/Kuala_Lumpur',
        merchant,pkg,schedule,customer:{...customer,email},paymentMethod,paymentOption:option,requestKey:requestKey.current,
        serviceId:Number(pkg.id),packageId:pkg.selectedPackages[0]?Number(pkg.selectedPackages[0].id):undefined,
        optionIds:pkg.selectedOptions.map(o=>Number(o.id)),couponCode:couponCode||undefined});
      setConfirmation(result);
      if(result.bookingAccessToken)sessionStorage.setItem(`booking-access:${result.id}`,result.bookingAccessToken);
      sessionStorage.setItem(`booking-reference:${result.id}`,result.bookingRef);
      clearSavedDraft();
      if((result.paymentSummary?.online_due_sen||0)>0){
        const attempt=await paymentApi.checkout(result.id,result.bookingAccessToken||'',window.location.origin+'/payments/return');
        sessionStorage.setItem(`payment-booking:${attempt.id}`,String(result.id));
        if(attempt.payment_url)window.location.assign(attempt.payment_url);
        else navigate(`/payments/return?attempt=${encodeURIComponent(attempt.id)}`);
      }
    }catch(e){setError(e instanceof Error?e.message:'Unable to place this booking.');availability.refresh();}finally{setSubmitting(false);}
  }
  const shell='rounded-2xl border border-ink-100 bg-white p-5 shadow-sm';
  if(confirmation){
    const summary=confirmation.paymentSummary;
    return <PageContainer><TopNav title="Booking"/><main className="mx-auto w-full max-w-xl space-y-4 p-6"><CheckCircle className="text-brand-600" size={40}/><h1 className="text-2xl font-bold">{confirmation.status==='approved'?'Booking confirmed':'Booking awaiting payment'}</h1>
      <p className="font-bold">{confirmation.bookingRef}</p><p>{merchant.name}</p><div className={shell}><Row label="Booking total" value={formatCurrency(confirmation.total)}/><Row label="Paid" value={formatCurrency((summary?.paid_sen||0)/100)}/><Row label="Outstanding" value={formatCurrency((summary?.outstanding_sen||0)/100)}/></div>
      <p>{confirmation.status==='approved'?'Your appointment is reserved. Any outstanding amount is payable at the venue.':'Your slot is held for 30 minutes. Payment must be verified to confirm it.'}</p>
      {error&&<p role="alert" className="text-red-700">{error}</p>}
      {confirmation.status!=='approved'&&<PrimaryButton disabled={submitting} onClick={()=>{setSubmitting(true);void paymentApi.checkout(confirmation.id,confirmation.bookingAccessToken||'',window.location.origin+'/payments/return').then(a=>{sessionStorage.setItem(`payment-booking:${a.id}`,String(confirmation.id));if(a.payment_url)window.location.assign(a.payment_url);else navigate(`/payments/return?attempt=${encodeURIComponent(a.id)}`);}).catch(e=>setError(e.message)).finally(()=>setSubmitting(false));}}>Continue payment</PrimaryButton>}
      <PrimaryButton onClick={()=>{reset();navigate('/');}}>Back to home</PrimaryButton>
    </main></PageContainer>;
  }
  return <PageContainer><TopNav title="Checkout"/><main className="mx-auto w-full max-w-3xl space-y-5 p-5 pb-28">
    <section className={shell}><h1 className="mb-4 text-xl font-bold">Review your booking</h1><Row label="Business" value={merchant.name}/><Row label="Service" value={pkg.name}/><Row label="Date" value={formatDate(schedule.date)}/><Row label="Time" value={schedule.slot}/><Row label="Customer" value={customer.name}/><Row label="Phone" value={customer.phone}/></section>
    <section className={shell}><h2 className="mb-3 font-bold">How would you like to pay?</h2><BookingAvailabilityNotice availability={availability}/>
      <div className="space-y-3">{options?.options.map(o=><label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-100 p-4"><input type="radio" name="payment-option" checked={option===o} onChange={()=>setOption(o)}/><span>{labels[o]}{o==='deposit'?` · up to ${formatCurrency(options.deposit_sen/100)}`:''}</span></label>)}</div>
      {dueNow>0&&<label className="mt-4 block">Email for payment receipt<input className="mt-2 w-full rounded-xl border border-ink-200 p-3" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
      <p className="mt-3 text-sm text-ink-500">{option==='venue'?'Your booking is confirmed without online payment. Pay the business at your appointment.':'You will continue to Billplz to choose FPX, card or an available wallet. Confirmation follows verified payment.'}</p>
    </section>
    <section className={shell}><h2 className="mb-3 font-bold">Payment breakdown</h2>{quote?.lines.map((line,i)=><Row key={i} label={line.name} value={formatCurrency(line.amount)}/>)}{quote&&quote.discountAmount>0&&<Row label="Discount" value={'−'+formatCurrency(quote.discountAmount)}/>}<Row label="Booking total" value={formatCurrency(total)} bold/><Row label="Pay online now" value={formatCurrency(dueNow)} bold/><Row label="Due at venue" value={formatCurrency(total-dueNow)}/></section>
    <p className="flex items-center gap-2 text-sm text-ink-500"><Shield size={18}/>Payment details are entered on Billplz.</p>{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <PrimaryButton fullWidth onClick={()=>void submit()} disabled={!availability.available||submitting||!schedule.startTime||!options?.options.includes(option)}>{!availability.available?'Booking unavailable':submitting?'Creating booking…':dueNow>0?`Continue to payment · ${formatCurrency(dueNow)}`:'Confirm · pay at venue'}</PrimaryButton>
  </main><BottomActionBar><span className="text-sm">Booking total {formatCurrency(total)} · Online now {formatCurrency(dueNow)}</span></BottomActionBar></PageContainer>;
}
