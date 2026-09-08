import type { Merchant } from "../types";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
// Ported from the design mockup. Only used by the mock API client — delete
// this file once a real backend is wired up in api/httpClient.ts.

export const CATEGORIES = ["All", "Beauty", "Wellness", "Pets", "Auto", "Education"];

export const MERCHANTS: Merchant[] = [
  {
    id: "1",
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
    email: "hello@glowstudiokl.com",
    phone: "+60 3-2141 5566",
    address: "12, Jalan Chow Kit, 50350 Kuala Lumpur, Malaysia",
    businessHours: {
      monday: { open: "10:00", close: "20:00" },
      tuesday: { open: "10:00", close: "20:00" },
      wednesday: { open: "10:00", close: "20:00" },
      thursday: { open: "10:00", close: "20:00" },
      friday: { open: "10:00", close: "21:00" },
      saturday: { open: "10:00", close: "21:00" },
      sunday: null,
    },
    faqs:
      "<p><strong>Do I need to book in advance?</strong><br/>Walk-ins are welcome, but booking ahead guarantees your slot.</p><p><strong>What's your cancellation policy?</strong><br/>Free cancellation up to 2 hours before your appointment.</p>",
    termsAndConditions:
      "<p>Please arrive 10 minutes before your appointment. Late arrivals beyond 15 minutes may be rescheduled. Full payment is due at time of service.</p>",
    timezone: "Asia/Kuala_Lumpur",
    currency: "MYR",
    gallery: [
      { gradient: ["#f9a8d4", "#c026d3"], label: "Nail Art" },
      { gradient: ["#fda4af", "#f43f5e"], label: "Lash Extensions" },
      { gradient: ["#d8b4fe", "#9333ea"], label: "Facial" },
      { gradient: ["#fbcfe8", "#db2777"], label: "Manicure" },
    ],
    services: [
      {
        id: "s1",
        name: "Manicure",
        desc: "Nail shaping, cuticle care, and polish.",
        price: 15,
        duration: 60,

        packages: [
          {
            id: "p1",
            name: "Classic Manicure",
            duration: 45,
            price: 30,
            desc: "Shape, buff, cuticle care + 2 coats polish",
            options: [
              { id: "o1", name: "French Tips", desc: "Classic white-tip finish", price: 12 },
              { id: "o2", name: "Hand Massage", desc: "5-minute paraffin hand massage", price: 15 },
            ],
          },
          {
            id: "p2",
            name: "Gel Nail Set",
            duration: 90,
            price: 73,
            desc: "Full gel nail application with art design",
            options: [
              { id: "o3", name: "Nail Art (per hand)", desc: "Custom hand-painted design", price: 20 },
              { id: "o4", name: "Gel Removal", desc: "Soak-off of existing gel set", price: 10 },
            ],
          },
        ],
      },
      {
        id: "s2",
        name: "Lash & Brow",
        desc: "Lash lifting and tinting treatments.",
        price: 20,
        duration: 60,

        packages: [
          {
            id: "p3",
            name: "Lash Lift & Tint",
            duration: 60,
            price: 100,
            desc: "Lift, tint, and nourishing treatment",
            options: [{ id: "o5", name: "Brow Tint", desc: "Matching brow tint add-on", price: 18 }],
          },
        ],
      },
    ],
  },
  {
    id: "2",
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
    email: "care@zenbodyworks.my",
    phone: "+60 3-6211 8890",
    address: "3-1, Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur, Malaysia",
    businessHours: {
      monday: { open: "09:00", close: "22:00" },
      tuesday: { open: "09:00", close: "22:00" },
      wednesday: { open: "09:00", close: "22:00" },
      thursday: { open: "09:00", close: "22:00" },
      friday: { open: "09:00", close: "22:00" },
      saturday: { open: "09:00", close: "22:00" },
      sunday: { open: "10:00", close: "20:00" },
    },
    faqs:
      "<p><strong>Is this suitable during pregnancy?</strong><br/>Please let us know when booking so we can assign a suitable therapist and treatment.</p><p><strong>Do you offer couple sessions?</strong><br/>Yes, our private rooms can accommodate two guests — select it under Packages.</p>",
    termsAndConditions:
      "<p>Rescheduling is free with at least 4 hours' notice. No-shows are charged 50% of the package price.</p>",
    timezone: "Asia/Kuala_Lumpur",
    currency: "MYR",
    gallery: [
      { gradient: ["#99f6e4", "#0891b2"], label: "Swedish Massage" },
      { gradient: ["#7dd3fc", "#2563eb"], label: "Reflexology" },
      { gradient: ["#6ee7b7", "#059669"], label: "Cupping" },
      { gradient: ["#bae6fd", "#0284c7"], label: "Aromatherapy" },
    ],
    services: [
      {
        id: "s1",
        name: "Body Massage",
        desc: "Full-body relaxation and therapeutic massage.",
        price: 10,
        duration: 60,

        packages: [
          {
            id: "p1",
            name: "60-min Swedish",
            duration: 60,
            price: 70,
            desc: "Classic full-body relaxation massage",
            options: [{ id: "o1", name: "Aromatherapy Oils", desc: "Choice of essential oil blend", price: 15 }],
          },
          {
            id: "p2",
            name: "90-min Deep Tissue",
            duration: 90,
            price: 120,
            desc: "Targeted muscle relief + hot stones",
            options: [
              { id: "o2", name: "Hot Stones", desc: "Heated stone therapy add-on", price: 25 },
              { id: "o3", name: "Extra 30 Minutes", desc: "Extend the session by 30 minutes", price: 40 },
            ],
          },
        ],
      },
      {
        id: "s2",
        name: "Reflexology",
        desc: "Traditional pressure-point foot therapy.",
        price: 10,
        duration: 60,

        packages: [
          {
            id: "p3",
            name: "Foot Reflexology",
            duration: 45,
            price: 50,
            desc: "Traditional pressure-point therapy",
            options: [{ id: "o4", name: "Extra 15 Minutes", desc: "Extend the session by 15 minutes", price: 20 }],
          },
        ],
      },
      {
        id: "s3",
        name: "Quick Chair Massage",
        desc: "15-minute seated massage, no booking tiers — just the base rate.",
        price: 35,
        duration: 15,

        packages: [],
      },
    ],
  },
  {
    id: "3",
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
    email: "woof@pawsomepetsalon.my",
    phone: "+60 3-5613 2244",
    address: "22-G, Jalan SS15/4, Subang Jaya, 47500 Selangor, Malaysia",
    businessHours: {
      monday: null,
      tuesday: { open: "09:30", close: "18:30" },
      wednesday: { open: "09:30", close: "18:30" },
      thursday: { open: "09:30", close: "18:30" },
      friday: { open: "09:30", close: "18:30" },
      saturday: { open: "09:00", close: "19:00" },
      sunday: { open: "09:00", close: "19:00" },
    },
    faqs:
      "<p><strong>Can I stay while my pet is groomed?</strong><br/>We recommend drop-off to keep pets calm, but viewing windows are available.</p><p><strong>Do you groom aggressive or anxious pets?</strong><br/>Yes, our groomers are trained in gentle handling — let us know in advance.</p>",
    termsAndConditions:
      "<p>Vaccination records must be shown at drop-off. We reserve the right to decline service for pets showing signs of illness or aggression.</p>",
    timezone: "Asia/Kuala_Lumpur",
    currency: "MYR",
    gallery: [
      { gradient: ["#fed7aa", "#ea580c"], label: "Dog Bath" },
      { gradient: ["#fde68a", "#d97706"], label: "Cat Grooming" },
      { gradient: ["#fef08a", "#ca8a04"], label: "Nail Trim" },
      { gradient: ["#fdba74", "#c2410c"], label: "Styling" },
    ],
    services: [
      {
        id: "s1",
        name: "Dog & Cat Grooming",
        desc: "Bath, trim, and styling for all breeds.",
        price: 5,
        duration: 60,

        packages: [
          {
            id: "p1",
            name: "Basic Bath & Dry",
            duration: 60,
            price: 50,
            desc: "Shampoo, blow-dry + ear cleaning",
            options: [{ id: "o1", name: "Nail Trim", desc: "Nail trim add-on", price: 10 }],
          },
          {
            id: "p2",
            name: "Full Groom Package",
            duration: 120,
            price: 90,
            desc: "Bath, trim, nails, ear clean + bandana",
            options: [
              { id: "o2", name: "De-shedding Treatment", desc: "Reduces loose undercoat shedding", price: 20 },
              { id: "o3", name: "Post-groom Photoshoot", desc: "Printed photo of your pet post-groom", price: 8 },
            ],
          },
        ],
      },
      {
        id: "s2",
        name: "Puppy Grooming",
        desc: "Gentle first-groom experience for puppies.",
        price: 5,
        duration: 60,

        packages: [
          {
            id: "p3",
            name: "Puppy First Groom",
            duration: 45,
            price: 45,
            desc: "Gentle intro session for puppies under 6mo",
            options: [],
          },
        ],
      },
    ],
  },
  {
    id: "4",
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
    email: "book@sparkcleanauto.my",
    phone: "+60 3-7876 3300",
    address: "45, Jalan SS2/24, Petaling Jaya, 47300 Selangor, Malaysia",
    businessHours: {
      monday: { open: "08:00", close: "19:00" },
      tuesday: { open: "08:00", close: "19:00" },
      wednesday: { open: "08:00", close: "19:00" },
      thursday: { open: "08:00", close: "19:00" },
      friday: { open: "08:00", close: "19:00" },
      saturday: { open: "08:00", close: "19:00" },
      sunday: { open: "08:00", close: "17:00" },
    },
    faqs:
      "<p><strong>How long does a full detail take?</strong><br/>Typically 2.5–3 hours depending on vehicle size and condition.</p><p><strong>Do you offer pick-up and drop-off?</strong><br/>Yes, available for Petaling Jaya and Subang Jaya addresses on request.</p>",
    termsAndConditions:
      "<p>We are not liable for pre-existing paint or interior damage. Valuables should be removed from the vehicle before service.</p>",
    timezone: "Asia/Kuala_Lumpur",
    currency: "MYR",
    gallery: [
      { gradient: ["#93c5fd", "#3b82f6"], label: "Exterior Wash" },
      { gradient: ["#a5b4fc", "#6366f1"], label: "Interior Detail" },
      { gradient: ["#7dd3fc", "#0284c7"], label: "Engine Bay" },
      { gradient: ["#c4b5fd", "#7c3aed"], label: "Ceramic Coat" },
    ],
    services: [
      {
        id: "s1",
        name: "Car Wash",
        desc: "Express exterior wash and detailing.",
        price: 5,
        duration: 60,

        packages: [
          {
            id: "p1",
            name: "Express Wash",
            duration: 30,
            price: 25,
            desc: "Exterior wash + tyre shine + window wipe",
            options: [{ id: "o1", name: "Interior Vacuum", desc: "Quick interior vacuum add-on", price: 15 }],
          },
          {
            id: "p2",
            name: "Full Detail",
            duration: 180,
            price: 145,
            desc: "Interior vacuum, shampoo + exterior polish",
            options: [
              { id: "o2", name: "Leather Conditioning", desc: "Condition and protect leather seats", price: 40 },
              { id: "o3", name: "Engine Bay Clean", desc: "Degrease and clean engine bay", price: 35 },
            ],
          },
        ],
      },
      {
        id: "s2",
        name: "Paint Protection",
        desc: "Long-lasting ceramic coating treatment.",
        price: 10,
        duration: 60,

        packages: [
          {
            id: "p3",
            name: "Ceramic Coating",
            duration: 240,
            price: 340,
            desc: "Long-lasting paint protection treatment",
            options: [{ id: "o4", name: "Wheel Coating", desc: "Ceramic coating extended to wheels", price: 60 }],
          },
        ],
      },
    ],
  },
];
