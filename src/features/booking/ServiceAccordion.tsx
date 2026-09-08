import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { formatCurrency } from "../../lib/style";
import type { Service, ServiceOption, ServicePackage, ServicePackageTier } from "../../types";

interface ServiceAccordionProps {
  services: Service[];
  onBook: (pkg: ServicePackage) => void;
  /** A previously-booked package to restore selections for and auto-expand, e.g. when the
   * customer navigates back here from the booking flow to change their package. */
  initialPackage?: ServicePackage | null;
}

export function ServiceAccordion({ services, onBook, initialPackage }: ServiceAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    initialPackage?.id ?? services[0]?.id ?? null,
  );

  return (
    <div className="flex flex-col gap-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          expanded={expandedId === service.id}
          onToggle={() => setExpandedId((prev) => (prev === service.id ? null : service.id))}
          onBook={onBook}
          initialPackage={initialPackage && initialPackage.id === service.id ? initialPackage : null}
        />
      ))}
    </div>
  );
}

function ServiceCard({
  service,
  expanded,
  onToggle,
  onBook,
  initialPackage,
}: {
  service: Service;
  expanded: boolean;
  onToggle: () => void;
  onBook: (pkg: ServicePackage) => void;
  initialPackage?: ServicePackage | null;
}) {
  const hasDrilldown = service.packages.length > 0;

  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(
    () => new Set(initialPackage?.selectedPackages.map((p) => p.id) ?? []),
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(
    () => new Set(initialPackage?.selectedOptions.map((o) => o.id) ?? []),
  );

  const togglePackage = (packageId: string) => {
    setSelectedPackageIds((prev) => {
      const next = new Set(prev);
      if (next.has(packageId)) next.delete(packageId);
      else next.add(packageId);
      return next;
    });
  };

  const toggleOption = (optionId: string) => {
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const selectedPackages: ServicePackageTier[] = service.packages.filter((p) => selectedPackageIds.has(p.id));
  // Options are nested under packages — only options belonging to a checked package are selectable/priced.
  const availableOptions: ServiceOption[] = selectedPackages.flatMap((p) => p.options);
  const selectedOptions: ServiceOption[] = availableOptions.filter((o) => selectedOptionIds.has(o.id));

  const packagesTotal = selectedPackages.reduce((sum, p) => sum + p.price, 0);
  const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const total = service.price + packagesTotal + optionsTotal;
  const duration = selectedPackages.length
    ? Math.max(...selectedPackages.map((p) => p.duration))
    : service.duration;

  const handleBook = () => {
    onBook({
      id: service.id,
      name: service.name,
      duration,
      price: service.price,
      desc: service.desc,
      selectedPackages,
      selectedOptions,
      total,
    });
  };

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={hasDrilldown ? onToggle : undefined}
        disabled={!hasDrilldown}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent p-4 text-left disabled:cursor-default"
      >
        <div className="min-w-0">
          <p className="m-0 text-sm font-bold text-ink-900">{service.name}</p>
          {service.desc && <p className="mt-0.5 text-xs text-ink-500">{service.desc}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-extrabold text-brand-600">
            {hasDrilldown ? "From " : ""}
            {formatCurrency(service.price)}
            {service.pricingBasis === "per_hour" && (
              <span className="text-xs font-semibold text-ink-400">/hr</span>
            )}
          </span>
          {hasDrilldown && (
            <ChevronDown
              size={16}
              className={`text-ink-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      {!hasDrilldown && (
        <div className="flex items-center justify-between border-t border-ink-100 p-4 pt-3.5">
          <div>
            <span className="text-[11px] text-ink-400">Total</span>
            <p className="m-0 text-base font-black text-brand-600">
              {formatCurrency(service.price, { estimate: true })}
            </p>
            <span className="text-[10px] text-ink-400">Estimated — final price confirmed at checkout</span>
          </div>
          <button
            type="button"
            onClick={handleBook}
            className="cursor-pointer rounded-full border-0 bg-brand-600 px-[18px] py-2 text-xs font-bold text-white hover:bg-brand-700"
          >
            Book Now
          </button>
        </div>
      )}

      {expanded && hasDrilldown && (
        <div className="flex flex-col gap-3 border-t border-ink-100 p-4 pt-3.5">
          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-ink-400">Packages</p>
            {service.packages.map((pkg) => (
              <label
                key={pkg.id}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-1.5 hover:bg-ink-50"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPackageIds.has(pkg.id)}
                    onChange={() => togglePackage(pkg.id)}
                    className="mt-0.5 h-3.5 w-3.5 accent-brand-600"
                  />
                  <div>
                    <p className="m-0 text-xs font-semibold text-ink-800">{pkg.name}</p>
                    {pkg.desc && <p className="m-0 text-[11px] text-ink-500">{pkg.desc}</p>}
                    <p className="m-0 mt-0.5 text-[11px] text-ink-400">{pkg.duration} min</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ink-600">
                  +{formatCurrency(pkg.price)}
                  {pkg.pricingBasis === "per_hour" && <span className="text-ink-400">/hr</span>}
                </span>
              </label>
            ))}
          </div>

          {availableOptions.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-ink-100 pt-2.5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-ink-400">Add-ons</p>
              {selectedPackages
                .filter((pkg) => pkg.options.length > 0)
                .map((pkg) => (
                  <div key={pkg.id} className="flex flex-col gap-1">
                    {selectedPackages.length > 1 && (
                      <p className="m-0 pl-1 text-[10px] font-semibold text-ink-400">For {pkg.name}</p>
                    )}
                    <div className="flex flex-col gap-1 border-l-2 border-ink-100 pl-3">
                      {pkg.options.map((opt) => (
                        <label
                          key={opt.id}
                          className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-1 hover:bg-ink-50"
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedOptionIds.has(opt.id)}
                              onChange={() => toggleOption(opt.id)}
                              className="mt-0.5 h-3.5 w-3.5 accent-brand-600"
                            />
                            <div>
                              <p className="m-0 text-xs font-semibold text-ink-800">{opt.name}</p>
                              {opt.desc && <p className="m-0 text-[11px] text-ink-500">{opt.desc}</p>}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-ink-600">
                            +{formatCurrency(opt.price)}
                            {opt.pricingBasis === "per_hour" && <span className="text-ink-400">/hr</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-ink-100 pt-2.5">
            <div>
              <span className="text-[11px] text-ink-400">Total</span>
              <p className="m-0 text-base font-black text-brand-600">
                {formatCurrency(total, { estimate: true })}
              </p>
              <span className="text-[10px] text-ink-400">Estimated — final price confirmed at checkout</span>
            </div>
            <button
              type="button"
              onClick={handleBook}
              className="cursor-pointer rounded-full border-0 bg-brand-600 px-[18px] py-2 text-xs font-bold text-white hover:bg-brand-700"
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
