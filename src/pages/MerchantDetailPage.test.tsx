// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MerchantDetailPage } from './MerchantDetailPage';

const mocks = vi.hoisted(() => ({ authenticated: false, startBooking: vi.fn() }));
const merchant = {
  id: 'salon', name: 'Salon', category: 'Salon', rating: 5, reviews: 0, location: 'KL', distance: '',
  priceFrom: 50, tag: '', tagColor: '', tagText: '', gradient: ['#000', '#111'] as [string, string],
  description: '', features: [], gallery: [], timezone: 'Asia/Kuala_Lumpur',
  services: [{ id: '1', name: 'Haircut', desc: '', price: 50, duration: 60, packages: [] }],
};

vi.mock('../api', () => ({ api: { getMerchant: vi.fn(() => Promise.resolve(merchant)) } }));
vi.mock('../lib/useBookingAvailability', () => ({ useBookingAvailability: () => ({ available: true, loading: false, options: null, error: null, refresh: vi.fn() }) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ authenticated: mocks.authenticated }) }));
vi.mock('../context/BookingFlowContext', () => ({ useBookingFlow: () => ({ merchant: null, pkg: null, startBooking: mocks.startBooking }) }));

beforeEach(() => { mocks.authenticated = false; mocks.startBooking.mockReset(); });
afterEach(cleanup);

function show() {
  return render(<MemoryRouter initialEntries={['/merchants/salon?tab=packages']}><Routes>
    <Route path="/merchants/:merchantId" element={<MerchantDetailPage />} />
    <Route path="/login" element={<div>Account choice</div>} />
    <Route path="/merchants/:merchantId/book" element={<div>Schedule</div>} />
  </Routes></MemoryRouter>);
}

test('guest Book Now saves the draft and opens the account choice', async () => {
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Book Now' }));
  expect(mocks.startBooking).toHaveBeenCalledOnce();
  expect(await screen.findByText('Account choice')).toBeTruthy();
});

test('authenticated Book Now proceeds directly to scheduling', async () => {
  mocks.authenticated = true;
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Book Now' }));
  expect(await screen.findByText('Schedule')).toBeTruthy();
});
