// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { PaymentReturnPage } from './PaymentReturnPage';
import { paymentApi } from '../api/httpClient';
vi.mock('../api/httpClient',()=>({paymentApi:{attempt:vi.fn(),status:vi.fn()}}));
afterEach(()=>{cleanup();sessionStorage.clear();vi.clearAllMocks();});

test('paid redirect parameters cannot confirm an unverified booking',async()=>{
  vi.mocked(paymentApi.attempt).mockResolvedValue({id:'attempt',status:'pending',amount_sen:3000,booking_id:1});
  vi.mocked(paymentApi.status).mockResolvedValue({total_sen:10000,paid_sen:0,outstanding_sen:10000,online_due_sen:3000,financial_status:'unpaid',payment_policy:'deposit',booking_status:'pending'});
  render(<MemoryRouter initialEntries={['/payments/return?attempt=attempt&billplz[paid]=true']}><PaymentReturnPage/></MemoryRouter>);
  await screen.findByText('Status: pending');
  expect(screen.queryByRole('heading',{name:'Booking confirmed'})).toBeNull();
});

test('a verified deposit confirms the booking and preserves the venue balance',async()=>{
  vi.mocked(paymentApi.attempt).mockResolvedValue({id:'attempt',status:'paid',amount_sen:3000,booking_id:1});
  vi.mocked(paymentApi.status).mockResolvedValue({total_sen:10000,paid_sen:3000,outstanding_sen:7000,online_due_sen:3000,financial_status:'partially_paid',payment_policy:'deposit',booking_status:'approved'});
  render(<MemoryRouter initialEntries={['/payments/return?attempt=attempt']}><PaymentReturnPage/></MemoryRouter>);
  await screen.findByRole('heading',{name:'Booking confirmed'});
  expect(screen.getByText(/Due at venue:/).textContent).toContain('RM70');
});
