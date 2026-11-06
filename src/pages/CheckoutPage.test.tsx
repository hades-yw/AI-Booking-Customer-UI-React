// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CheckoutPage } from './CheckoutPage';
import { BOOKING_UNAVAILABLE } from '../lib/useBookingAvailability';

const mocks = vi.hoisted(() => ({ options: vi.fn(), create: vi.fn(), checkout: vi.fn() }));
vi.mock('../api/httpClient', () => ({ paymentApi: { options: mocks.options, checkout: mocks.checkout } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../api', () => ({ api: { createBooking: mocks.create } }));
vi.mock('../context/BookingFlowContext', () => ({ useBookingFlow: () => ({
  merchant: { id: 'salon', name: 'Salon', timezone: 'Asia/Kuala_Lumpur' },
  pkg: { id: '1', name: 'Service', total: 100, selectedPackages: [], selectedOptions: [] },
  schedule: { date: '2026-11-10', slot: '10:00', startTime: '2026-11-10T02:00:00Z' },
  customer: { name: 'Customer', phone: '0123456789', email: 'customer@example.com' },
  clearSavedDraft: vi.fn(), reset: vi.fn(),
}) }));
const active = { options: ['venue'], deposit_sen: 0, gateway: null, booking_available: true };
const paused = { ...active, booking_available: false, booking_message: BOOKING_UNAVAILABLE };
function show() { return render(<MemoryRouter><CheckoutPage/></MemoryRouter>); }
beforeEach(() => { mocks.options.mockResolvedValue(active); });
afterEach(() => { cleanup(); vi.resetAllMocks(); sessionStorage.clear(); });

test('paused checkout greys the confirmation button and exposes no billing reason', async () => {
  mocks.options.mockResolvedValue(paused); show();
  await screen.findByText(BOOKING_UNAVAILABLE);
  expect((screen.getByRole('button', { name: 'Booking unavailable' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Booking unavailable' }));
  expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.checkout).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toMatch(/credit|reload|billing review|debt/i);
});

test('loading blocks submission, and a recovered branch can book after Check again', async () => {
  mocks.options.mockResolvedValueOnce(paused).mockResolvedValue(active); show();
  expect((screen.getByRole('button', { name: 'Booking unavailable' }) as HTMLButtonElement).disabled).toBe(true);
  await screen.findByText(BOOKING_UNAVAILABLE);
  fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
  await waitFor(() => expect((screen.getByRole('button', { name: 'Confirm · pay at venue' }) as HTMLButtonElement).disabled).toBe(false));
});

test('failed availability lookup stays disabled and has a recoverable retry', async () => {
  mocks.options.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(active); show();
  await screen.findByText('Unable to check online booking availability. Please try again.');
  fireEvent.click(screen.getByRole('button', { name: 'Retry availability' }));
  await screen.findByRole('button', { name: 'Confirm · pay at venue' });
});

test('focusing an open page rechecks a newly paused branch', async () => {
  mocks.options.mockResolvedValueOnce(active).mockResolvedValue(paused); show();
  await screen.findByRole('button', { name: 'Confirm · pay at venue' });
  fireEvent.focus(window);
  await screen.findByText(BOOKING_UNAVAILABLE);
  expect((screen.getByRole('button', { name: 'Booking unavailable' }) as HTMLButtonElement).disabled).toBe(true);
});

test('a server rejection after the availability check refreshes the button without starting payment', async () => {
  mocks.options.mockResolvedValueOnce(active).mockResolvedValue(paused);
  mocks.create.mockRejectedValueOnce(new Error(BOOKING_UNAVAILABLE)); show();
  fireEvent.click(await screen.findByRole('button', { name: 'Confirm · pay at venue' }));
  await screen.findByRole('button', { name: 'Booking unavailable' });
  expect(mocks.create).toHaveBeenCalledOnce(); expect(mocks.checkout).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toMatch(/credit|reload|billing review|debt/i);
});
