// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ConfirmationPage } from './ConfirmationPage';

const mocks = vi.hoisted(() => ({
  setCustomer: vi.fn(),
  setCoupon: vi.fn(),
  auth: { authenticated: false, user: null as null | { id: number; name: string; email: string; emailVerified: boolean } },
}));

vi.mock('../api', () => ({ api: { getQuote: vi.fn(() => Promise.reject(new Error('quote unavailable'))) } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../context/BookingFlowContext', () => ({ useBookingFlow: () => ({
  merchant: { id: 'salon', name: 'Salon', timezone: 'Asia/Kuala_Lumpur' },
  pkg: { id: '1', name: 'Service', duration: 60, price: 100, total: 100, selectedPackages: [], selectedOptions: [] },
  schedule: { date: '2030-01-07', slot: '10:00 AM', startTime: '2030-01-07T10:00:00' },
  customer: null, couponCode: null, quote: null,
  setCustomer: mocks.setCustomer, setCoupon: mocks.setCoupon,
}) }));

beforeEach(() => {
  mocks.auth.authenticated = false;
  mocks.auth.user = null;
  mocks.setCustomer.mockReset();
});
afterEach(cleanup);

function show() {
  return render(<MemoryRouter><ConfirmationPage /></MemoryRouter>);
}

test('guest details require email and carry it to checkout state', () => {
  show();
  fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Guest' } });
  fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '0123456789' } });
  const proceed = screen.getAllByRole('button', { name: /Proceed to Checkout/ })[0] as HTMLButtonElement;
  expect(proceed.disabled).toBe(true);
  fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'guest@example.com' } });
  expect(proceed.disabled).toBe(false);
  fireEvent.click(proceed);
  expect(mocks.setCustomer).toHaveBeenCalledWith(expect.objectContaining({ email: 'guest@example.com' }));
});

test('signed-in customer uses the verified read-only account email', () => {
  mocks.auth.authenticated = true;
  mocks.auth.user = { id: 1, name: 'Account Customer', email: 'verified@example.com', emailVerified: true };
  show();
  const email = screen.getByDisplayValue('verified@example.com') as HTMLInputElement;
  expect(email.readOnly).toBe(true);
});
