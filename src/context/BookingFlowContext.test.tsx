// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Merchant, Quote, ServicePackage } from "../types";
import { BookingFlowProvider, useBookingFlow } from "./BookingFlowContext";

const merchant = { id: "salon", name: "Salon" } as Merchant;
const pkg = { id: "1", name: "Cut" } as ServicePackage;
const quote = { totalAmount: 50 } as Quote;

function Probe({ capture }: { capture: (value: ReturnType<typeof useBookingFlow>) => void }) {
  capture(useBookingFlow());
  return null;
}

describe("booking redirect draft", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores the booking but discards pricing that may have become stale", () => {
    let flow: ReturnType<typeof useBookingFlow> | undefined;
    const first = render(<BookingFlowProvider><Probe capture={(value) => { flow = value; }} /></BookingFlowProvider>);
    act(() => {
      flow?.startBooking(merchant, pkg);
      flow?.setCoupon("SAVE10", quote);
    });
    first.unmount();

    render(<BookingFlowProvider><Probe capture={(value) => { flow = value; }} /></BookingFlowProvider>);
    expect(flow?.merchant?.id).toBe("salon");
    expect(flow?.couponCode).toBeNull();
    expect(flow?.quote).toBeNull();
  });

  it("drops drafts older than thirty minutes", () => {
    sessionStorage.setItem("booklocal_booking_draft", JSON.stringify({
      savedAt: Date.now() - 31 * 60 * 1000,
      state: { merchant, pkg },
    }));
    let flow: ReturnType<typeof useBookingFlow> | undefined;
    render(<BookingFlowProvider><Probe capture={(value) => { flow = value; }} /></BookingFlowProvider>);
    expect(flow?.merchant).toBeNull();
    expect(sessionStorage.getItem("booklocal_booking_draft")).toBeNull();
  });
});
