import { useBookingAvailability } from '../../lib/useBookingAvailability';
export function BookingAvailabilityNotice({ availability }: { availability: ReturnType<typeof useBookingAvailability> }) {
  if (!availability.message) return null;
  return <div role="status" className="my-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-600">
    <span>{availability.message}</span>
    {!availability.loading && !availability.available && <button type="button" className="ml-2 underline" onClick={availability.refresh}>{availability.failed ? 'Retry availability' : 'Check again'}</button>}
  </div>;
}
