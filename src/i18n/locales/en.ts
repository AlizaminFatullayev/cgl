/**
 * English catalogue -- the authoritative source. Every other locale falls back
 * to these strings, so nothing here may be removed without updating az and ru.
 *
 * The client's marketing copy (home, services, about) is verbatim client text.
 * Do not reword it.
 */
export const en = {
  common: {
    loading: 'Loading…',
    save: 'Save',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    open: 'Open',
    close: 'Close',
    search: 'Search',
    optional: 'optional',
    signIn: 'Sign in',
    signOut: 'Sign out',
    register: 'Register',
    dashboard: 'Dashboard',
    backToDashboard: 'Back to dashboard',
    pageNotFound: 'Page not found',
    notAvailable: '—',
    language: 'Language',
    menu: 'Menu',
    openMenu: 'Open menu',
    /**
     * Vehicle status labels.
     *
     * CRITICAL: these are DISPLAY ONLY. The keys are the exact English values
     * stored in vehicles.status, enforced by a CHECK constraint and read by
     * the guard_vehicle_status trigger. Never translate the stored value, and
     * never use a translated string in a query, filter, insert or comparison.
     */
    status: {
      'At Auction': 'At Auction',
      'In Transit': 'In Transit',
      'At Port': 'At Port',
      'On Ocean': 'On Ocean',
      Delivered: 'Delivered',
      unknown: 'Unknown',
    },
    /**
     * Invoice status labels. Same rule as above: the key is the stored value.
     */
    invoiceStatus: {
      unpaid: 'Unpaid',
      partial: 'Partial',
      paid: 'Paid',
      cancelled: 'Cancelled',
    },
    /** Role labels. Same rule: 'user' / 'admin' are stored values. */
    role: {
      user: 'Customer',
      admin: 'Admin',
    },
  },

  nav: {
    home: 'Home',
    services: 'Services',
    calculator: 'Calculator',
    tracking: 'Tracking',
    about: 'About',
    contact: 'Contact',
    vehicles: 'Vehicles',
    invoices: 'Invoices',
    transactions: 'Transactions',
    admin: 'Admin',
  },

  footer: {
    tagline: 'Reliable car shipping from USA auctions to anywhere in the world.',
    company: 'Company',
    tools: 'Tools',
    contact: 'Contact',
    vinTracking: 'VIN Tracking',
    address: 'Əhməd Rəcəbli küçəsi 3, Narimanov, Bakı',
    rights: '© 2026 Caspian Global Logistics. All rights reserved.',
    builtFor: 'Built for shippers worldwide.',
  },

  home: {
    heroBadge: 'Live VIN tracking on 12,000+ vehicles',
    heroTitle: 'Ship Cars From USA Worldwide',
    heroSubtitle:
      "From the auction floor to your driveway. Transparent pricing, real-time tracking, and a team that moves your car like it's our own.",
    trackVin: 'Track VIN',
    calculateShipping: 'Calculate Shipping',
    statCarsShipped: 'Cars Shipped',
    statDestinations: 'Destinations',
    statOnTime: 'On-time Rate',

    dealersEyebrow: 'ATTENTION DEALERS!',
    dealersTitle: '0$ — All Service Fees Free',
    feeDealerService: 'Dealer Service Fee',
    feeTransaction: 'Transaction Fee',
    feeLate: 'Late Fee',
    feeThc: 'THC',
    feeStorage: 'Storage',
    feeCarfax: 'Carfax Report',

    whyEyebrow: 'WHY CASPIAN GLOBAL LOGISTICS',
    // TODO(translation): $3,000 coverage limit -- needs client review.
    whyInsuredTitle: 'Insured up to $3,000',
    // TODO(translation): $3,000 coverage limit -- needs client review.
    whyInsuredBody:
      'Insurance is free up to $3,000 — your car is covered door-to-port.',
    whyAccountsTitle: 'Original IAAI & Copart Accounts',
    whyAccountsBody:
      'We hold verified dealer accounts at IAAI and Copart — bid directly, no middlemen.',
    whyTransporterTitle: '$350 Car Transporter',
    whyTransporterBody:
      'Flat $350 inland transport from auction yard to our port — one of the lowest rates on the market.',
    whyRatesTitle: 'Best Rates',
    whyRatesBody:
      'Direct carrier contracts mean lower prices, no hidden fees.',

    stepsEyebrow: 'HOW IT WORKS',
    stepsTitle: 'Four simple steps to your driveway',
    step1Title: 'Find & Buy',
    step1Body: 'Pick a car from any US auction. We bid or accept your VIN.',
    step2Title: 'Pickup & Inland',
    step2Body: 'Auction yard to the loading port within 5–7 days.',
    step3Title: 'Load at Port',
    step3Body: 'Container or RoRo. Loaded under camera surveillance.',
    step4Title: 'Ship & Deliver',
    step4Body: 'Ocean transit, customs clearance, and final delivery.',

    reviewsEyebrow: 'REVIEWS',
    reviewsTitle: 'Trusted by importers worldwide',
    review1:
      'Picked up my Tesla from Copart and delivered to Baku in 38 days. Tracking updates every step.',
    review2:
      'Best price I could find. The calculator was spot-on with the final invoice.',
    review3: 'Smooth process. The team answered every question within minutes.',

    faqEyebrow: 'FAQ',
    faqTitle: 'Questions, answered',
    faq1Q: 'How long does shipping take?',
    faq1A:
      'TODO(content): typical door-to-port and ocean transit times per destination.',
    faq2Q: 'Do you handle customs clearance?',
    faq2A:
      'TODO(content): which destinations we clear customs for and what the client must supply.',
    faq3Q: 'What does the calculator include?',
    faq3A:
      'TODO(content): confirm exactly which legs and fees the published rate covers.',
    faq4Q: 'Can I track my car in real time?',
    faq4A:
      'TODO(content): describe how VIN tracking works and when statuses update.',

    contactEyebrow: 'CONTACT',
    contactTitle: 'Get a quote in minutes',
    contactSubtitle:
      'Tell us about your shipment. Our team replies within one business hour.',
    callUs: 'Call us',
  },

  services: {
    eyebrow: 'SERVICES',
    title: 'Everything you need to import a car',
    subtitle:
      'From the auction floor to your front door, Caspian Global Logistics covers every leg of the journey.',
    biddingTitle: 'Auction Bidding',
    biddingBody: 'Copart and IAAI — we bid live or accept your won lot.',
    truckingTitle: 'Inland Trucking',
    truckingBody: 'Yard pickup to loading port within 5–7 days nationwide.',
    loadingTitle: 'Port Loading',
    loadingBody:
      'Container, RoRo, or consolidated loading at major US ports.',
    insuranceTitle: 'Cargo Insurance',
    // TODO(translation): $3,000 coverage limit -- needs client review.
    insuranceBody:
      'Free all-risk coverage from yard to port, up to $3,000.',
    customsTitle: 'Customs & Docs',
    customsBody:
      'Title work, bill of lading, and destination customs support.',
  },

  about: {
    eyebrow: 'ABOUT',
    titleLead: 'Moving cars across oceans, ',
    titleTail: 'one VIN at a time',
    p1: 'Caspian Global Logistics (CGL) is an officially registered LLC logistics company built on years of experience in vehicle import and strong international partnerships.',
    p2: 'Our goal is to provide our clients with transparent, reliable and comfortable vehicle import services. That is why we give our clients original auction accounts — protecting them from middlemen and extra risks, and ensuring maximum comfort during the auction process.',
    // TODO(translation): $3,000 coverage limit -- needs client review.
    p3: 'Our company offers vehicle import services with full guarantee, free insurance up to $3,000 and competitive transport prices. There are no hidden or extra fees in the prices we offer.',
    p4: 'We sincerely thank all of our clients who trust us.',
    sincerely: 'Sincerely,',
    management: 'CGL Management',
    statPorts: 'Destination ports',
    statClients: 'Happy clients',
    statYears: 'Years of expertise',
    statOnTime: 'On-time delivery',
  },

  contact: {
    name: 'Name',
    email: 'Email',
    vin: 'VIN',
    message: 'Message',
    send: 'Send Message',
    sentTitle: 'Message sent',
    sentBody:
      'Thanks — we have your message and will get back to you by email.',
    sendAnother: 'Send another message',
    errorPrefix: 'We could not send your message: {{error}}. Please try again.',
    vNameMin: 'Enter your name',
    vEmail: 'Enter a valid email address',
    vVinMax: 'A VIN is at most 17 characters',
    vMessageMin: 'Tell us a bit more (10+ characters)',
  },

  calculator: {
    eyebrow: 'Transportation pricing',
    title: 'Shipping calculator',
    subtitle:
      'Choose the auction state and branch to see the transportation total. Rates are read from our published rate table.',
    loadingRates: 'Loading rates…',
    loadError: 'Could not load rates: {{error}}',
    noRates:
      'No shipping rates are available yet. The rate table has not been populated.',
    routeTitle: 'Route',
    routeSubtitle: 'Step 1: pick a state. Step 2: pick the auction branch.',
    state: 'State',
    branch: 'Branch',
    selectState: 'Select a state',
    selectBranch: 'Select a branch',
    selectStateFirst: 'Select a state first',
    searchStateHint: 'Type a name or code — "AL" and "Alab" both find Alabama.',
    searchBranchHint: 'Type any part of the branch name.',
    noMatch: 'Nothing matches "{{query}}".',
    stepOne: 'Step 1',
    stepTwo: 'Step 2',
    routeSummary: 'Route',
    noBranches: 'No branches with a published rate in this state.',
    totalTitle: 'Transportation total',
    totalFinal: 'Final price — no extra fees are added.',
    totalPrompt: 'Pick a state and branch to see the price.',
  },

  tracking: {
    eyebrow: 'TRACKING',
    title: 'Track your vehicle',
    subtitle: 'Enter the 17-character VIN to see live status.',
    track: 'Track',
    vinLength: 'A VIN is exactly 17 characters.',
    lookupError: 'Could not run the lookup: {{error}}',
    notFoundTitle: 'Not found or not available',
    notFoundBody:
      'We could not find a vehicle you can view with that VIN. If the car is yours, sign in first — tracking shows the vehicles on your own account.',
    container: 'Container',
    booking: 'Booking',
    added: 'Added',
    timeline: 'Status timeline',
    current: 'Current',
  },

  auth: {
    signInTitle: 'Sign in',
    signInSubtitle: 'Access your car-import dashboard.',
    registerTitle: 'Create an account',
    registerSubtitle: 'Start tracking your vehicle imports.',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    createAccount: 'Create account',
    noAccount: 'No account?',
    alreadyRegistered: 'Already registered?',
    checkEmailTitle: 'Check your email',
    checkEmailBody:
      'We sent you a confirmation link. Confirm your address, then sign in.',
    goToSignIn: 'Go to sign in',
    vEmail: 'Enter a valid email address',
    vPasswordRequired: 'Password is required',
    vPasswordMin: 'Password must be at least 8 characters',
    vFullName: 'Enter your full name',
  },

  dashboard: {
    title: 'Dashboard',
    account: 'Account',
    balance: 'Balance',
    balanceHint: 'Managed by our staff.',
    vehicles: 'Vehicles',
    viewAll: 'View all',
    addVehicle: 'Add vehicle',
    noNameSet: 'No name set',
  },

  vehicles: {
    myVehicles: 'My vehicles',
    loadingVehicles: 'Loading your vehicles…',
    loadError: 'Could not load your vehicles: {{error}}',
    emptyTitle: 'You have not added a vehicle yet.',
    emptyCta: 'Add your first vehicle',
    untitled: 'Untitled vehicle',
    vin: 'VIN',
    lot: 'Lot',
    container: 'Container',
    booking: 'Booking',
    receiver: 'Receiver',
    shippingLine: 'Shipping line',
    total: 'Total',
    paid: 'Paid',
    added: 'Added',

    addTitle: 'Add a vehicle',
    detailsTitle: 'Vehicle details',
    detailsSubtitle:
      'New vehicles start at status “At Auction”. Only our staff can move a vehicle to the next status.',
    year: 'Year',
    make: 'Make',
    model: 'Model',
    lotNumber: 'Lot number',
    containerNumber: 'Container number',
    bookingNumber: 'Booking number',
    totalAmount: 'Total amount (USD)',
    notes: 'Notes',
    photos: 'Photos',
    photoHint:
      'JPEG, PNG, WebP or AVIF. Pick as many as you like — large photos are resized in your browser before upload.',
    photoAddMore: 'Add more photos',
    photoSelected_one: '{{count}} photo selected',
    photoSelected_other: '{{count}} photos selected',
    photoStatePending: 'Waiting',
    photoStateCompressing: 'Resizing…',
    photoStateUploading: 'Uploading…',
    photoStateDone: 'Uploaded',
    photoStateFailed: 'Failed',
    photoCompressedTo: '{{from}} → {{to}}',
    photoRetryFailed: 'Retry failed photos',
    photoSummary: '{{done}} of {{total}} uploaded, {{failed}} failed.',
    photoRemove: 'Remove {{name}}',
    errPhotoHeic:
      '{{name}}: HEIC photos cannot be read in the browser. Export it as JPEG and try again.',
    errPhotoType: '{{name}}: unsupported format ({{type}}). Use JPEG, PNG, WebP or AVIF.',
    errPhotoTooLarge:
      '{{name}} is {{size}}, which is over the {{limit}} limit even after resizing.',
    removeFile: 'Remove {{name}}',
    saveVehicle: 'Save vehicle',
    goToMyVehicles: 'Go to my vehicles',
    vYear: 'Enter a 4-digit year between 1900 and 2100',
    vVin: 'A VIN is at most 17 characters',
    vAmount: 'Enter a non-negative amount',
    errSession: 'Your session expired. Please sign in again.',
    errSave: 'Could not save the vehicle: {{error}}',
    errNotSaved:
      'The vehicle was not saved. Your account may not have permission to add vehicles — please contact support.',
    warnPhotos:
      'The vehicle was saved, but some photos did not attach: {{errors}}',
  },
} as const

/**
 * Same key structure as `en`, but every leaf widened to `string`.
 *
 * `as const` above gives literal types, which would force az/ru to repeat the
 * English text. This keeps the compiler enforcing that every locale has every
 * key -- a missing or misspelled key is a build error -- while letting the
 * values be actual translations.
 */
type Translated<T> = {
  [K in keyof T]: T[K] extends string ? string : Translated<T[K]>
}

export type Catalogue = Translated<typeof en>
