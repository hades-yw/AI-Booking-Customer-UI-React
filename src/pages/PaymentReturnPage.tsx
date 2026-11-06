import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../api/httpClient';
import type { PaymentAttempt, PaymentSummary } from '../api/httpClient';
import { formatCurrency } from '../lib/style';

export function PaymentReturnPage(){
  const [params]=useSearchParams();const id=params.get('attempt')||'';
  const [attempt,setAttempt]=useState<PaymentAttempt|null>(null);const [summary,setSummary]=useState<PaymentSummary|null>(null);const [error,setError]=useState('');const [retry,setRetry]=useState(0);
  useEffect(()=>{let stopped=false;let timer=0;let count=0;const bookingId=sessionStorage.getItem(`payment-booking:${id}`);const token=bookingId?sessionStorage.getItem(`booking-access:${bookingId}`)||'':'';
    async function check(){try{const a=await paymentApi.attempt(id,token);if(stopped)return;setAttempt(a);setError('');if(a.booking_id){const s=await paymentApi.status(a.booking_id,token);if(!stopped)setSummary(s);}if(!stopped&&a.status==='pending'&&++count<20)timer=window.setTimeout(check,3000);}catch(e){if(!stopped)setError(e instanceof Error?e.message:'Unable to verify payment.');}}
    if(id)void check();return()=>{stopped=true;window.clearTimeout(timer);};
  },[id,retry]);
  const confirmed=summary?.booking_status==='approved';
  return <main className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl font-bold">{confirmed?'Booking confirmed':attempt?.status==='review'?'Payment received · booking needs review':'Checking payment'}</h1>
    <p>{confirmed?'Your payment has been verified by the server.':attempt?.status==='review'?'The business needs to review this payment before confirming your appointment. Please contact them.':'Returning from checkout is not proof of payment. We are waiting for verified confirmation.'}</p>
    {attempt&&<p>Status: {attempt.status}</p>}{summary&&<dl className="space-y-2"><div>Total: {formatCurrency(summary.total_sen/100)}</div><div>Paid: {formatCurrency(summary.paid_sen/100)}</div><div>Due at venue: {formatCurrency(summary.outstanding_sen/100)}</div></dl>}
    {!id&&<p role="alert">No payment reference was provided.</p>}{error&&<p role="alert" className="text-red-700">{error} Use the same browser that started checkout, or sign in to your booking account.</p>}
    <button className="rounded-xl bg-brand-600 px-4 py-3 text-white" onClick={()=>setRetry(retry+1)}>Check again</button>{attempt?.status==='pending'&&attempt.payment_url&&<a className="block" href={attempt.payment_url}>Return to payment checkout</a>}<Link className="block" to="/">Back to home</Link>
  </main>;
}
