import { useState } from "react";
import {
  Search, MapPin, Star, Clock, ChevronLeft, Heart, Share2,
  Check, Calendar, ArrowRight, Zap, Phone, User, FileText,
  CreditCard, CheckCircle, Shield, Smartphone
} from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Beauty", "Wellness", "Pets", "Auto", "Education"];

const MERCHANTS = [
  {
    id: 1,
    name: "Glow Studio KL",
    category: "Beauty",
    rating: 4.8,
    reviews: 234,
    location: "Chow Kit, KL",
    distance: "1.2 km",
    priceFrom: 45,
    tag: "Top Rated",
    tagColor: "#fbbf24",
    tagText: "#78350f",
    gradient: ["#f472b6", "#e11d48"],
    description:
      "Award-winning beauty studio specialising in nail art, lash extensions, and facials. Our certified beauticians ensure every visit leaves you refreshed and confident.",
    features: ["Certified Beauticians", "Premium Products", "Walk-in Welcome", "Sanitised Tools"],
    gallery: [
      { gradient: ["#f9a8d4", "#c026d3"], label: "Nail Art" },
      { gradient: ["#fda4af", "#f43f5e"], label: "Lash Extensions" },
      { gradient: ["#d8b4fe", "#9333ea"], label: "Facial" },
      { gradient: ["#fbcfe8", "#db2777"], label: "Manicure" },
    ],
    packages: [
      { id: "p1", name: "Classic Manicure", duration: 45, price: 45, desc: "Shape, buff, cuticle care + 2 coats polish" },
      { id: "p2", name: "Gel Nail Set", duration: 90, price: 88, desc: "Full gel nail application with art design" },
      { id: "p3", name: "Lash Lift & Tint", duration: 60, price: 120, desc: "Lift, tint, and nourishing treatment" },
    ],
  },
  {
    id: 2,
    name: "Zen Body Works",
    category: "Wellness",
    rating: 4.9,
    reviews: 412,
    location: "Mont Kiara, KL",
    distance: "3.4 km",
    priceFrom: 80,
    tag: "Best Seller",
    tagColor: "#34d399",
    tagText: "#064e3b",
    gradient: ["#2dd4bf", "#0284c7"],
    description:
      "A sanctuary of calm in Mont Kiara. We offer traditional and modern massage therapies, cupping, and reflexology by licensed therapists in private, serene rooms.",
    features: ["Licensed Therapists", "Private Rooms", "Aromatherapy", "Corporate Packages"],
    gallery: [
      { gradient: ["#99f6e4", "#0891b2"], label: "Swedish Massage" },
      { gradient: ["#7dd3fc", "#2563eb"], label: "Reflexology" },
      { gradient: ["#6ee7b7", "#059669"], label: "Cupping" },
      { gradient: ["#bae6fd", "#0284c7"], label: "Aromatherapy" },
    ],
    packages: [
      { id: "p1", name: "60-min Swedish", duration: 60, price: 80, desc: "Classic full-body relaxation massage" },
      { id: "p2", name: "90-min Deep Tissue", duration: 90, price: 130, desc: "Targeted muscle relief + hot stones" },
      { id: "p3", name: "Foot Reflexology", duration: 45, price: 60, desc: "Traditional pressure-point therapy" },
    ],
  },
  {
    id: 3,
    name: "Pawsome Pet Salon",
    category: "Pets",
    rating: 4.7,
    reviews: 189,
    location: "Subang Jaya, Selangor",
    distance: "5.1 km",
    priceFrom: 55,
    tag: "New",
    tagColor: "#818cf8",
    tagText: "#1e1b4b",
    gradient: ["#fb923c", "#d97706"],
    description:
      "Full-service pet grooming for dogs and cats. Our groomers are gentle, patient, and trained to handle all breeds and temperaments with love.",
    features: ["All Breeds", "Gentle Handling", "Organic Products", "Post-groom Photos"],
    gallery: [
      { gradient: ["#fed7aa", "#ea580c"], label: "Dog Bath" },
      { gradient: ["#fde68a", "#d97706"], label: "Cat Grooming" },
      { gradient: ["#fef08a", "#ca8a04"], label: "Nail Trim" },
      { gradient: ["#fdba74", "#c2410c"], label: "Styling" },
    ],
    packages: [
      { id: "p1", name: "Basic Bath & Dry", duration: 60, price: 55, desc: "Shampoo, blow-dry + ear cleaning" },
      { id: "p2", name: "Full Groom Package", duration: 120, price: 95, desc: "Bath, trim, nails, ear clean + bandana" },
      { id: "p3", name: "Puppy First Groom", duration: 45, price: 50, desc: "Gentle intro session for puppies under 6mo" },
    ],
  },
  {
    id: 4,
    name: "SparkClean Auto",
    category: "Auto",
    rating: 4.6,
    reviews: 301,
    location: "Petaling Jaya, Selangor",
    distance: "2.8 km",
    priceFrom: 30,
    tag: "Top Rated",
    tagColor: "#fbbf24",
    tagText: "#78350f",
    gradient: ["#60a5fa", "#4f46e5"],
    description:
      "Professional car detailing and wash centre. From express washes to full interior detailing — we treat every car as our own.",
    features: ["Waterless Option", "Interior Detail", "Express Lane", "Loyalty Points"],
    gallery: [
      { gradient: ["#93c5fd", "#3b82f6"], label: "Exterior Wash" },
      { gradient: ["#a5b4fc", "#6366f1"], label: "Interior Detail" },
      { gradient: ["#7dd3fc", "#0284c7"], label: "Engine Bay" },
      { gradient: ["#c4b5fd", "#7c3aed"], label: "Ceramic Coat" },
    ],
    packages: [
      { id: "p1", name: "Express Wash", duration: 30, price: 30, desc: "Exterior wash + tyre shine + window wipe" },
      { id: "p2", name: "Full Detail", duration: 180, price: 150, desc: "Interior vacuum, shampoo + exterior polish" },
      { id: "p3", name: "Ceramic Coating", duration: 240, price: 350, desc: "Long-lasting paint protection treatment" },
    ],
  },
];

// ─── AVAILABILITY GENERATOR ────────────────────────────────────────────────────

function generateAvailability() {
  const slots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const available = slots.filter(() => Math.random() > 0.35);
    return { date: d, slots: available };
  });
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(d) {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

// ─── SHARED: ROW ITEM ────────────────────────────────────────────────────────

function Row({ label, value, bold = false, accent = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      <span style={{
        fontSize: bold ? 15 : 13,
        fontWeight: bold ? 700 : 500,
        color: accent ? "#4f46e5" : "#1e293b"
      }}>{value}</span>
    </div>
  );
}

// ─── GRADIENT HELPER ──────────────────────────────────────────────────────────

function gradientStyle(colors) {
  return { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` };
}

// ─── PAGE 1: LANDING ──────────────────────────────────────────────────────────

function LandingPage({ onSelect }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState({});

  const filtered = MERCHANTS.filter((m) => {
    const matchCat = activeCategory === "All" || m.category === activeCategory;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", paddingTop: 48, paddingBottom: 24, paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ color: "#c7d2fe", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Your location</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <MapPin size={13} color="white" />
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Kuala Lumpur, MY</span>
            </div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>Y</span>
          </div>
        </div>
        <p style={{ color: "white", fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 14 }}>
          What are you<br />booking today?
        </p>
        <div style={{ position: "relative" }}>
          <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services or merchants…"
            style={{
              width: "100%", background: "white", borderRadius: 14, paddingLeft: 36, paddingRight: 16,
              paddingTop: 12, paddingBottom: 12, fontSize: 13, color: "#334155", border: "none",
              outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div style={{ overflowX: "auto", paddingTop: 12, paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 8, paddingLeft: 16, paddingRight: 16, width: "max-content" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: activeCategory === cat ? "none" : "1.5px solid #e2e8f0",
                background: activeCategory === cat ? "#4f46e5" : "white",
                color: activeCategory === cat ? "white" : "#64748b",
                boxShadow: activeCategory === cat ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
                transition: "all 0.15s", whiteSpace: "nowrap"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant list */}
      <div style={{ padding: "8px 16px 0" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 12 }}>
          {filtered.length} merchants near you
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              style={{
                background: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)", cursor: "pointer", textAlign: "left",
                padding: 0, width: "100%"
              }}
            >
              {/* Card image */}
              <div style={{ ...gradientStyle(m.gradient), height: 160, position: "relative", display: "flex", alignItems: "flex-end", padding: 12 }}>
                <span style={{
                  background: m.tagColor, color: m.tagText, fontSize: 11, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 999
                }}>{m.tag}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setLiked((l) => ({ ...l, [m.id]: !l[m.id] })); }}
                  style={{
                    position: "absolute", top: 12, right: 12, width: 32, height: 32,
                    background: "rgba(255,255,255,0.85)", borderRadius: "50%", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                  }}
                >
                  <Heart size={14} color={liked[m.id] ? "#ef4444" : "#64748b"} fill={liked[m.id] ? "#ef4444" : "none"} />
                </button>
              </div>
              {/* Card info */}
              <div style={{ padding: "12px 16px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, margin: "2px 0 0" }}>{m.category}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>From RM{m.priceFrom}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{m.rating}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>({m.reviews})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94a3b8" }}>
                    <MapPin size={11} />
                    <span style={{ fontSize: 11 }}>{m.location} · {m.distance}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2: MERCHANT DETAIL ──────────────────────────────────────────────────

function MerchantDetailPage({ merchant, onBack, onBook }) {
  const [tab, setTab] = useState("About");
  const tabs = ["About", "Gallery", "Packages"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero */}
      <div style={{ ...gradientStyle(merchant.gradient), height: 220, position: "relative" }}>
        <button onClick={onBack} style={{
          position: "absolute", top: 44, left: 16, width: 36, height: 36,
          background: "rgba(255,255,255,0.85)", borderRadius: "50%", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <ChevronLeft size={20} color="#334155" />
        </button>
        <button style={{
          position: "absolute", top: 44, right: 16, width: 36, height: 36,
          background: "rgba(255,255,255,0.85)", borderRadius: "50%", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <Share2 size={15} color="#334155" />
        </button>
      </div>

      {/* Merchant card */}
      <div style={{
        margin: "0 16px", marginTop: -32, background: "white", borderRadius: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: 16, position: "relative", zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", margin: 0 }}>{merchant.name}</p>
            <p style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginTop: 2 }}>{merchant.category}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <Star size={13} color="#fbbf24" fill="#fbbf24" />
              <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>{merchant.rating}</span>
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{merchant.reviews} reviews</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, color: "#64748b" }}>
          <MapPin size={12} />
          <span style={{ fontSize: 12 }}>{merchant.location} · {merchant.distance}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", margin: "20px 16px 0", borderBottom: "1.5px solid #e2e8f0" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, paddingBottom: 10, paddingTop: 4, fontSize: 13, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              color: tab === t ? "#4f46e5" : "#94a3b8",
              borderBottom: tab === t ? "2.5px solid #4f46e5" : "2.5px solid transparent",
              marginBottom: -1.5, transition: "color 0.15s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px 16px 120px" }}>
        {tab === "About" && (
          <div>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>{merchant.description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {merchant.features.map((f) => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", gap: 8, background: "#eef2ff",
                  borderRadius: 12, padding: "10px 12px"
                }}>
                  <div style={{
                    width: 20, height: 20, background: "#4f46e5", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <Check size={11} color="white" />
                  </div>
                  <span style={{ fontSize: 11, color: "#3730a3", fontWeight: 600 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Gallery" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {merchant.gallery.map((g, i) => (
              <div key={i} style={{
                ...gradientStyle(g.gradient), height: 140, borderRadius: 14,
                display: "flex", alignItems: "flex-end", padding: 8
              }}>
                <span style={{
                  color: "white", fontSize: 11, fontWeight: 600,
                  background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
                  padding: "2px 8px", borderRadius: 999
                }}>{g.label}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "Packages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {merchant.packages.map((pkg) => (
              <div key={pkg.id} style={{
                background: "white", borderRadius: 18, padding: 16,
                border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>{pkg.name}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#4f46e5", margin: 0 }}>RM{pkg.price}</p>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{pkg.desc}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}>
                    <Clock size={12} />
                    <span style={{ fontSize: 12 }}>{pkg.duration} min</span>
                  </div>
                  <button
                    onClick={() => onBook(pkg)}
                    style={{
                      background: "#4f46e5", color: "white", border: "none", borderRadius: 999,
                      padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA (only when not on Packages tab) */}
      {tab !== "Packages" && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", borderTop: "1px solid #f1f5f9", padding: "14px 16px", zIndex: 20
        }}>
          <button
            onClick={() => setTab("Packages")}
            style={{
              width: "100%", background: "#4f46e5", color: "white", border: "none", borderRadius: 16,
              padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(79,70,229,0.35)"
            }}
          >
            View Packages <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE 3: BOOKING ──────────────────────────────────────────────────────────

function BookingPage({ merchant, pkg, onBack, onProceed }) {
  const [availability] = useState(generateAvailability);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const day = availability[selectedDay];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      {/* Nav */}
      <div style={{
        background: "white", borderBottom: "1px solid #f1f5f9",
        paddingTop: 44, paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        display: "flex", alignItems: "center", gap: 12
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e2e8f0",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <ChevronLeft size={19} color="#334155" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Select Date & Time</span>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Package recap */}
        <div style={{ ...gradientStyle(merchant.gradient), borderRadius: 20, padding: 16 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>
            {merchant.name}
          </p>
          <p style={{ color: "white", fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{pkg.name}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.75)" }}>
              <Clock size={13} />
              <span style={{ fontSize: 13 }}>{pkg.duration} min</span>
            </div>
            <span style={{ color: "white", fontWeight: 900, fontSize: 20 }}>RM{pkg.price}</span>
          </div>
        </div>

        {/* Date strip */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} color="#6366f1" /> Choose a Date
          </p>
          <div style={{ overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
            <div style={{ display: "flex", gap: 8, width: "max-content", paddingBottom: 4 }}>
              {availability.map((av, i) => {
                const d = av.date;
                const isSelected = selectedDay === i;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      padding: "10px 10px 8px", borderRadius: 14, minWidth: 56,
                      background: isSelected ? "#4f46e5" : "white",
                      border: isSelected ? "none" : "1.5px solid #e2e8f0",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 4px 14px rgba(79,70,229,0.3)" : "none",
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? "#c7d2fe" : "#94a3b8" }}>
                      {i === 0 ? "Today" : DAY_NAMES[d.getDay()]}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: isSelected ? "white" : "#1e293b", margin: "2px 0" }}>
                      {d.getDate()}
                    </span>
                    <span style={{ fontSize: 10, color: isSelected ? "#c7d2fe" : "#94a3b8" }}>
                      {MONTH_NAMES[d.getMonth()]}
                    </span>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", marginTop: 4,
                      background: av.slots.length === 0 ? "#f87171" : isSelected ? "rgba(255,255,255,0.5)" : "#34d399"
                    }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time slots */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="#6366f1" /> Available Times — {formatDate(day.date)}
          </p>
          {day.slots.length === 0 ? (
            <div style={{ background: "#fef2f2", borderRadius: 14, padding: 16, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, margin: 0 }}>No slots available on this date.</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, marginBottom: 0 }}>Please choose another day.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {day.slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: "10px 0", borderRadius: 12, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: selectedSlot === slot ? "none" : "1.5px solid #e2e8f0",
                    background: selectedSlot === slot ? "#4f46e5" : "white",
                    color: selectedSlot === slot ? "white" : "#475569",
                    boxShadow: selectedSlot === slot ? "0 2px 10px rgba(79,70,229,0.25)" : "none",
                    transition: "all 0.15s"
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: "1px solid #f1f5f9", padding: "12px 16px 20px", zIndex: 20
      }}>
        {selectedSlot && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Selected</span>
            <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>
              {formatDate(day.date)} · {selectedSlot}
            </span>
          </div>
        )}
        <button
          disabled={!selectedSlot}
          onClick={() => onProceed({ date: day.date, slot: selectedSlot })}
          style={{
            width: "100%", border: "none", borderRadius: 16,
            padding: "14px 0", fontSize: 14, fontWeight: 700,
            cursor: selectedSlot ? "pointer" : "not-allowed",
            background: selectedSlot ? "#4f46e5" : "#e2e8f0",
            color: selectedSlot ? "white" : "#94a3b8",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: selectedSlot ? "0 4px 14px rgba(79,70,229,0.35)" : "none",
            transition: "all 0.2s"
          }}
        >
          Proceed to Confirmation <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── PAGE 4: CONFIRMATION ─────────────────────────────────────────────────────

function ConfirmationPage({ merchant, pkg, booking, onBack, onCheckout }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const canProceed = name.trim().length > 0 && phone.trim().length > 0;

  const steps = ["Package", "Schedule", "Details", "Checkout"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      {/* Nav */}
      <div style={{
        background: "white", borderBottom: "1px solid #f1f5f9",
        paddingTop: 44, paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        display: "flex", alignItems: "center", gap: 12
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e2e8f0",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <ChevronLeft size={19} color="#334155" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Confirm Booking</span>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {steps.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < 2 ? "#10b981" : i === 2 ? "#4f46e5" : "#e2e8f0",
                fontSize: 10, fontWeight: 800,
                color: i < 3 ? "white" : "#94a3b8"
              }}>
                {i < 2 ? <Check size={10} /> : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, flexShrink: 0,
                color: i < 2 ? "#10b981" : i === 2 ? "#4f46e5" : "#94a3b8"
              }}>{step}</span>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: i < 2 ? "#86efac" : "#e2e8f0" }} />}
            </div>
          ))}
        </div>

        {/* Booking summary */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ ...gradientStyle(merchant.gradient), padding: "10px 16px" }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0 }}>Booking Summary</p>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label="Merchant" value={merchant.name} />
            <Row label="Service" value={pkg.name} />
            <Row label="Date" value={formatDate(booking.date)} />
            <Row label="Time" value={booking.slot} />
            <Row label="Duration" value={`${pkg.duration} min`} />
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
              <Row label="Total" value={`RM${pkg.price}`} bold accent />
            </div>
          </div>
        </div>

        {/* User details */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #f1f5f9", padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Your Details</p>
          {[
            { icon: <User size={14} color="#94a3b8" />, value: name, setter: setName, placeholder: "Full name", type: "text" },
            { icon: <Phone size={14} color="#94a3b8" />, value: phone, setter: setPhone, placeholder: "Phone number", type: "tel" },
          ].map(({ icon, value, setter, placeholder, type }, i) => (
            <div key={i} style={{ position: "relative", marginBottom: 10 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{icon}</div>
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                type={type}
                style={{
                  width: "100%", background: "#f8fafc", borderRadius: 12, paddingLeft: 36,
                  paddingRight: 14, paddingTop: 11, paddingBottom: 11, fontSize: 13, color: "#334155",
                  border: "1.5px solid #e2e8f0", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          ))}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: 12 }}><FileText size={14} color="#94a3b8" /></div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests (optional)"
              rows={2}
              style={{
                width: "100%", background: "#f8fafc", borderRadius: 12, paddingLeft: 36,
                paddingRight: 14, paddingTop: 11, paddingBottom: 11, fontSize: 13, color: "#334155",
                border: "1.5px solid #e2e8f0", outline: "none", boxSizing: "border-box",
                resize: "none", fontFamily: "inherit"
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: "1px solid #f1f5f9", padding: "12px 16px 20px", zIndex: 20
      }}>
        <button
          disabled={!canProceed}
          onClick={() => onCheckout({ name, phone, notes })}
          style={{
            width: "100%", border: "none", borderRadius: 16, padding: "14px 0",
            fontSize: 14, fontWeight: 700, cursor: canProceed ? "pointer" : "not-allowed",
            background: canProceed ? "#4f46e5" : "#e2e8f0",
            color: canProceed ? "white" : "#94a3b8",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: canProceed ? "0 4px 14px rgba(79,70,229,0.35)" : "none",
            transition: "all 0.2s"
          }}
        >
          Proceed to Checkout <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── PAGE 5: CHECKOUT ─────────────────────────────────────────────────────────

function CheckoutPage({ merchant, pkg, booking, userInfo, onBack, onConfirm }) {
  const [payMethod, setPayMethod] = useState("card");
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef] = useState("BK-" + Math.random().toString(36).slice(2, 8).toUpperCase());

  const payMethods = [
    { id: "card", label: "Credit / Debit Card", icon: CreditCard },
    { id: "wallet", label: "E-Wallet (Touch 'n Go / GrabPay)", icon: Smartphone },
  ];

  const total = pkg.price + 2;

  if (confirmed) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, background: "#d1fae5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle size={42} color="#10b981" />
        </div>
        <p style={{ fontSize: 24, fontWeight: 900, color: "#1e293b", marginBottom: 6 }}>Booking Confirmed!</p>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
          Your appointment has been placed.<br />A confirmation will be sent to {userInfo.phone}.
        </p>
        <div style={{
          background: "white", borderRadius: 20, border: "1px solid #f1f5f9",
          boxShadow: "0 4px 16px rgba(0,0,0,0.07)", padding: 20,
          width: "100%", maxWidth: 340, marginBottom: 20
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Booking Reference</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#4f46e5", letterSpacing: 3, marginBottom: 14 }}>{bookingRef}</p>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <Row label="Merchant" value={merchant.name} />
            <Row label="Service" value={pkg.name} />
            <Row label="Date" value={formatDate(booking.date)} />
            <Row label="Time" value={booking.slot} />
            <Row label="Paid" value={`RM${total}`} bold />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", marginBottom: 20 }}>
          <Shield size={12} />
          <span style={{ fontSize: 11 }}>Protected by BookLocal guarantee</span>
        </div>
        <button onClick={onConfirm} style={{ color: "#4f46e5", fontWeight: 700, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
          Back to Home
        </button>
      </div>
    );
  }

  const steps = ["Package", "Schedule", "Details", "Checkout"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 120 }}>
      {/* Nav */}
      <div style={{
        background: "white", borderBottom: "1px solid #f1f5f9",
        paddingTop: 44, paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        display: "flex", alignItems: "center", gap: 12
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e2e8f0",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <ChevronLeft size={19} color="#334155" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Checkout</span>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {steps.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < 3 ? "#10b981" : "#4f46e5",
                fontSize: 10, fontWeight: 800, color: "white"
              }}>
                {i < 3 ? <Check size={10} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, flexShrink: 0, color: i < 3 ? "#10b981" : "#4f46e5" }}>
                {step}
              </span>
              {i < 3 && <div style={{ flex: 1, height: 1.5, background: "#86efac" }} />}
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", margin: 0 }}>Order Summary</p>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label={pkg.name} value={`RM${pkg.price}`} />
            <Row label="Service fee" value="RM2" />
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
              <Row label="Total" value={`RM${total}`} bold />
            </div>
          </div>
        </div>

        {/* Booking for */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #f1f5f9", padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>Booking For</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Row label="Name" value={userInfo.name} />
            <Row label="Phone" value={userInfo.phone} />
            {userInfo.notes && <Row label="Notes" value={userInfo.notes} />}
          </div>
        </div>

        {/* Payment method */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #f1f5f9", padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Payment Method</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payMethods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPayMethod(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
                  background: payMethod === id ? "#eef2ff" : "white", cursor: "pointer",
                  border: payMethod === id ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
                  transition: "all 0.15s"
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: payMethod === id ? "#c7d2fe" : "#f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon size={16} color={payMethod === id ? "#4f46e5" : "#64748b"} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, textAlign: "left", color: payMethod === id ? "#3730a3" : "#475569" }}>
                  {label}
                </span>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${payMethod === id ? "#4f46e5" : "#cbd5e1"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {payMethod === id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5" }} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Guarantee */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", borderRadius: 14, padding: "12px 14px" }}>
          <Shield size={18} color="#22c55e" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#15803d", margin: 0, lineHeight: 1.5 }}>
            Free cancellation up to 24 hours before your appointment.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: "1px solid #f1f5f9", padding: "12px 16px 20px", zIndex: 20
      }}>
        <button
          onClick={() => setConfirmed(true)}
          style={{
            width: "100%", background: "#4f46e5", color: "white", border: "none",
            borderRadius: 16, padding: "15px 0", fontSize: 15, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(79,70,229,0.4)"
          }}
        >
          Confirm & Pay RM{total} <Zap size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("landing");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", background: "#f8fafc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", position: "relative" }}>
      {page === "landing" && (
        <LandingPage onSelect={(m) => { setSelectedMerchant(m); setPage("merchant"); }} />
      )}
      {page === "merchant" && selectedMerchant && (
        <MerchantDetailPage
          merchant={selectedMerchant}
          onBack={() => setPage("landing")}
          onBook={(pkg) => { setSelectedPkg(pkg); setPage("booking"); }}
        />
      )}
      {page === "booking" && selectedMerchant && selectedPkg && (
        <BookingPage
          merchant={selectedMerchant}
          pkg={selectedPkg}
          onBack={() => setPage("merchant")}
          onProceed={(info) => { setBookingInfo(info); setPage("confirmation"); }}
        />
      )}
      {page === "confirmation" && selectedMerchant && selectedPkg && bookingInfo && (
        <ConfirmationPage
          merchant={selectedMerchant}
          pkg={selectedPkg}
          booking={bookingInfo}
          onBack={() => setPage("booking")}
          onCheckout={(info) => { setUserInfo(info); setPage("checkout"); }}
        />
      )}
      {page === "checkout" && selectedMerchant && selectedPkg && bookingInfo && userInfo && (
        <CheckoutPage
          merchant={selectedMerchant}
          pkg={selectedPkg}
          booking={bookingInfo}
          userInfo={userInfo}
          onBack={() => setPage("confirmation")}
          onConfirm={() => {
            setPage("landing");
            setSelectedMerchant(null);
            setSelectedPkg(null);
            setBookingInfo(null);
            setUserInfo(null);
          }}
        />
      )}
    </div>
  );
}
