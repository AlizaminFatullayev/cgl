import type { Catalogue } from './en'

/**
 * Azerbaijani catalogue.
 *
 * UI chrome (buttons, labels, errors, validation, table headers) is properly
 * translated and ready to ship.
 *
 * The client's MARKETING COPY (home, services, about) is a working translation
 * only. Every one of those strings is marked TODO(translation) and must be
 * reviewed by the client before launch -- the English original is the
 * authoritative version. Review markers are listed in the comments above each
 * marketing block rather than inside the strings, so nothing leaks on screen.
 */
export const az: Catalogue = {
  common: {
    loading: 'Yüklənir…',
    save: 'Yadda saxla',
    saveChanges: 'Dəyişiklikləri saxla',
    cancel: 'Ləğv et',
    edit: 'Redaktə et',
    delete: 'Sil',
    open: 'Aç',
    close: 'Bağla',
    search: 'Axtarış',
    optional: 'istəyə bağlı',
    signIn: 'Daxil ol',
    signOut: 'Çıxış',
    register: 'Qeydiyyat',
    dashboard: 'Panel',
    backToDashboard: 'Panelə qayıt',
    pageNotFound: 'Səhifə tapılmadı',
    notAvailable: '—',
    language: 'Dil',
    /**
     * DISPLAY ONLY. The keys are the exact English values stored in
     * vehicles.status, enforced by a CHECK constraint and the
     * guard_vehicle_status trigger. Never translate the stored value, and
     * never use a translated string in a query, filter, insert or comparison.
     */
    status: {
      'At Auction': 'Hərracda',
      'In Transit': 'Yolda',
      'At Port': 'Limanda',
      'On Ocean': 'Okeanda',
      Delivered: 'Çatdırılıb',
      unknown: 'Naməlum',
    },
    /** DISPLAY ONLY -- keys are the stored invoice status values. */
    invoiceStatus: {
      unpaid: 'Ödənilməyib',
      partial: 'Qismən ödənilib',
      paid: 'Ödənilib',
      cancelled: 'Ləğv edilib',
    },
    /** DISPLAY ONLY -- 'user' / 'admin' are stored values. */
    role: {
      user: 'Müştəri',
      admin: 'Admin',
    },
  },

  nav: {
    home: 'Ana səhifə',
    services: 'Xidmətlər',
    calculator: 'Kalkulyator',
    tracking: 'İzləmə',
    about: 'Haqqımızda',
    contact: 'Əlaqə',
    vehicles: 'Avtomobillər',
    invoices: 'Hesab-fakturalar',
    transactions: 'Əməliyyatlar',
    admin: 'Admin',
  },

  footer: {
    tagline:
      'ABŞ hərraclarından dünyanın istənilən nöqtəsinə etibarlı avtomobil daşınması.',
    company: 'Şirkət',
    tools: 'Alətlər',
    contact: 'Əlaqə',
    vinTracking: 'VIN izləmə',
    // Physical address -- not translated.
    address: 'Əhməd Rəcəbli küçəsi 3, Narimanov, Bakı',
    rights: '© 2026 Caspian Global Logistics. Bütün hüquqlar qorunur.',
    builtFor: 'Dünya üzrə daşıyıcılar üçün hazırlanıb.',
  },

  // TODO(translation): entire `home` block is a working translation of the
  // client's marketing copy -- needs client review before launch.
  home: {
    heroBadge: '12 000-dən çox avtomobildə canlı VIN izləmə',
    heroTitle: 'ABŞ-dan dünyaya avtomobil daşınması',
    heroSubtitle:
      'Hərrac meydançasından həyətinizə qədər. Şəffaf qiymətlər, real vaxt izləmə və avtomobilinizi öz maşını kimi daşıyan komanda.',
    trackVin: 'VIN izlə',
    calculateShipping: 'Daşınmanı hesabla',
    statCarsShipped: 'Daşınmış avtomobil',
    statDestinations: 'Təyinat məntəqəsi',
    statOnTime: 'Vaxtında çatdırılma',

    dealersEyebrow: 'DİLERLƏRİN NƏZƏRİNƏ!',
    dealersTitle: '0$ — Bütün xidmət haqları pulsuz',
    feeDealerService: 'Diler xidmət haqqı',
    feeTransaction: 'Əməliyyat haqqı',
    feeLate: 'Gecikmə haqqı',
    feeThc: 'THC',
    feeStorage: 'Saxlanma',
    feeCarfax: 'Carfax hesabatı',

    whyEyebrow: 'NİYƏ CASPIAN GLOBAL LOGISTICS',
    whyInsuredTitle: 'Tam sığortalı',
    whyInsuredBody:
      'Pulsuz sığorta avtomobilinizi qapıdan limana qədər əhatə edir — 0%, əlavə haqq yoxdur.',
    whyAccountsTitle: 'Orijinal IAAI və Copart hesabları',
    whyAccountsBody:
      'IAAI və Copart-da təsdiqlənmiş diler hesablarımız var — birbaşa təklif verin, vasitəçisiz.',
    whyTransporterTitle: '350$ avtomobil daşıyıcısı',
    whyTransporterBody:
      'Hərrac meydançasından limanımıza sabit 350$ daxili daşınma — bazarın ən aşağı tariflərindən biri.',
    whyRatesTitle: 'Ən yaxşı tariflər',
    whyRatesBody:
      'Birbaşa daşıyıcı müqavilələri aşağı qiymət deməkdir, gizli haqq yoxdur.',

    stepsEyebrow: 'NECƏ İŞLƏYİR',
    stepsTitle: 'Həyətinizə qədər dörd sadə addım',
    step1Title: 'Tap və al',
    step1Body:
      'İstənilən ABŞ hərracından avtomobil seçin. Biz təklif veririk və ya VIN-inizi qəbul edirik.',
    step2Title: 'Götürmə və daxili daşınma',
    step2Body: 'Hərrac meydançasından yükləmə limanına 5–7 gün ərzində.',
    step3Title: 'Limanda yükləmə',
    step3Body: 'Konteyner və ya RoRo. Kamera nəzarəti altında yüklənir.',
    step4Title: 'Daşınma və çatdırılma',
    step4Body: 'Dəniz daşınması, gömrük rəsmiləşdirilməsi və son çatdırılma.',

    reviewsEyebrow: 'RƏYLƏR',
    reviewsTitle: 'Dünya üzrə idxalçıların etibar etdiyi şirkət',
    // Names and cities stay as written -- only the quoted text is translated.
    review1:
      'Tesla-mı Copart-dan götürüb 38 günə Bakıya çatdırdılar. Hər addımda izləmə yeniliyi gəlirdi.',
    review2:
      'Tapa bildiyim ən yaxşı qiymət. Kalkulyator son hesab-faktura ilə tam üst-üstə düşdü.',
    review3:
      'Rahat proses. Komanda hər sualıma dəqiqələr içində cavab verdi.',

    faqEyebrow: 'FAQ',
    faqTitle: 'Suallar və cavablar',
    faq1Q: 'Daşınma nə qədər çəkir?',
    faq1A:
      'TODO(content): təyinat üzrə tipik qapı-liman və dəniz daşınma müddətləri.',
    faq2Q: 'Gömrük rəsmiləşdirilməsini siz həll edirsiniz?',
    faq2A:
      'TODO(content): hansı təyinatlar üçün gömrük keçiririk və müştəri nə təqdim etməlidir.',
    faq3Q: 'Kalkulyator nələri əhatə edir?',
    faq3A:
      'TODO(content): dərc olunmuş tarifin hansı mərhələ və haqları əhatə etdiyini dəqiqləşdir.',
    faq4Q: 'Avtomobilimi real vaxtda izləyə bilərəmmi?',
    faq4A:
      'TODO(content): VIN izləmənin necə işlədiyini və statusların nə vaxt yeniləndiyini izah et.',

    contactEyebrow: 'ƏLAQƏ',
    contactTitle: 'Dəqiqələr içində qiymət alın',
    contactSubtitle:
      'Daşınmanız haqqında bizə məlumat verin. Komandamız bir iş saatı ərzində cavab verir.',
    callUs: 'Bizə zəng edin',
  },

  // TODO(translation): entire `services` block -- needs client review.
  services: {
    eyebrow: 'XİDMƏTLƏR',
    title: 'Avtomobil idxalı üçün lazım olan hər şey',
    subtitle:
      'Hərrac meydançasından qapınıza qədər Caspian Global Logistics yolun hər mərhələsini əhatə edir.',
    biddingTitle: 'Hərracda təklif',
    biddingBody:
      'Copart və IAAI — canlı təklif veririk və ya udduğunuz lotu qəbul edirik.',
    truckingTitle: 'Daxili yük daşınması',
    truckingBody:
      'Ölkə üzrə meydançadan yükləmə limanına 5–7 gün ərzində götürmə.',
    loadingTitle: 'Limanda yükləmə',
    loadingBody:
      'Əsas ABŞ limanlarında konteyner, RoRo və ya birləşdirilmiş yükləmə.',
    insuranceTitle: 'Yük sığortası',
    insuranceBody:
      'Meydançadan limana PULSUZ tam risk əhatəsi — 0%, əlavə haqq yoxdur.',
    customsTitle: 'Gömrük və sənədlər',
    customsBody:
      'Mülkiyyət sənədi, konosament və təyinat gömrüyü üzrə dəstək.',
  },

  // TODO(translation): entire `about` block -- needs client review.
  about: {
    eyebrow: 'HAQQIMIZDA',
    titleLead: 'Okeanlar aşırı avtomobil daşıyırıq, ',
    titleTail: 'hər dəfə bir VIN',
    p1: 'Caspian Global Logistics (CGL) avtomobil idxalında illərin təcrübəsi və güclü beynəlxalq tərəfdaşlıqlar üzərində qurulmuş, rəsmi qeydiyyatdan keçmiş MMC logistika şirkətidir.',
    p2: 'Məqsədimiz müştərilərimizə şəffaf, etibarlı və rahat avtomobil idxalı xidməti göstərməkdir. Məhz buna görə müştərilərimizə orijinal hərrac hesabları veririk — bu, onları vasitəçilərdən və əlavə risklərdən qoruyur və hərrac prosesində maksimum rahatlıq təmin edir.',
    p3: 'Şirkətimiz tam zəmanət, PULSUZ sığorta və rəqabətli daşınma qiymətləri ilə avtomobil idxalı xidməti təklif edir. Təklif etdiyimiz qiymətlərdə gizli və ya əlavə haqq yoxdur.',
    p4: 'Bizə etibar edən bütün müştərilərimizə səmimi təşəkkür edirik.',
    sincerely: 'Hörmətlə,',
    management: 'CGL rəhbərliyi',
    statPorts: 'Təyinat limanı',
    statClients: 'Məmnun müştəri',
    statYears: 'İllik təcrübə',
    statOnTime: 'Vaxtında çatdırılma',
  },

  contact: {
    name: 'Ad',
    email: 'E-poçt',
    vin: 'VIN',
    message: 'Mesaj',
    send: 'Mesaj göndər',
    sentTitle: 'Mesaj göndərildi',
    sentBody:
      'Təşəkkürlər — mesajınızı aldıq və e-poçt vasitəsilə sizinlə əlaqə saxlayacağıq.',
    sendAnother: 'Başqa mesaj göndər',
    errorPrefix:
      'Mesajınızı göndərə bilmədik: {{error}}. Zəhmət olmasa yenidən cəhd edin.',
    vNameMin: 'Adınızı daxil edin',
    vEmail: 'Düzgün e-poçt ünvanı daxil edin',
    vVinMax: 'VIN ən çox 17 simvoldur',
    vMessageMin: 'Bir az ətraflı yazın (10+ simvol)',
  },

  calculator: {
    eyebrow: 'Daşınma qiymətləri',
    title: 'Daşınma kalkulyatoru',
    subtitle:
      'Ümumi daşınma qiymətini görmək üçün hərrac ştatını və filialını seçin. Tariflər dərc olunmuş tarif cədvəlimizdən oxunur.',
    loadingRates: 'Tariflər yüklənir…',
    loadError: 'Tarifləri yükləmək mümkün olmadı: {{error}}',
    noRates: 'Hələ heç bir daşınma tarifi yoxdur. Tarif cədvəli doldurulmayıb.',
    routeTitle: 'Marşrut',
    routeSubtitle: 'Addım 1: ştatı seçin. Addım 2: hərrac filialını seçin.',
    state: 'Ştat',
    branch: 'Filial',
    selectState: 'Ştat seçin',
    selectBranch: 'Filial seçin',
    selectStateFirst: 'Əvvəlcə ştat seçin',
    noBranches: 'Bu ştatda dərc olunmuş tarifi olan filial yoxdur.',
    totalTitle: 'Ümumi daşınma',
    totalFinal: 'Son qiymət — əlavə haqq əlavə edilmir.',
    totalPrompt: 'Qiyməti görmək üçün ştat və filial seçin.',
  },

  tracking: {
    eyebrow: 'İZLƏMƏ',
    title: 'Avtomobilinizi izləyin',
    subtitle: 'Canlı statusu görmək üçün 17 simvolluq VIN daxil edin.',
    track: 'İzlə',
    vinLength: 'VIN dəqiq 17 simvoldur.',
    lookupError: 'Axtarışı yerinə yetirmək mümkün olmadı: {{error}}',
    notFoundTitle: 'Tapılmadı və ya əlçatan deyil',
    notFoundBody:
      'Bu VIN ilə baxa biləcəyiniz avtomobil tapılmadı. Avtomobil sizindirsə, əvvəlcə daxil olun — izləmə yalnız öz hesabınızdakı avtomobilləri göstərir.',
    container: 'Konteyner',
    booking: 'Bron',
    added: 'Əlavə edilib',
    timeline: 'Status xronologiyası',
    current: 'Cari',
  },

  auth: {
    signInTitle: 'Daxil ol',
    signInSubtitle: 'Avtomobil idxalı panelinizə daxil olun.',
    registerTitle: 'Hesab yaradın',
    registerSubtitle: 'Avtomobil idxalınızı izləməyə başlayın.',
    fullName: 'Ad və soyad',
    email: 'E-poçt',
    password: 'Şifrə',
    createAccount: 'Hesab yarat',
    noAccount: 'Hesabınız yoxdur?',
    alreadyRegistered: 'Artıq qeydiyyatdan keçmisiniz?',
    checkEmailTitle: 'E-poçtunuzu yoxlayın',
    checkEmailBody:
      'Sizə təsdiq linki göndərdik. Ünvanınızı təsdiqləyin, sonra daxil olun.',
    goToSignIn: 'Girişə keç',
    vEmail: 'Düzgün e-poçt ünvanı daxil edin',
    vPasswordRequired: 'Şifrə tələb olunur',
    vPasswordMin: 'Şifrə ən azı 8 simvol olmalıdır',
    vFullName: 'Ad və soyadınızı daxil edin',
  },

  dashboard: {
    title: 'Panel',
    account: 'Hesab',
    balance: 'Balans',
    balanceHint: 'Əməkdaşlarımız tərəfindən idarə olunur.',
    vehicles: 'Avtomobillər',
    viewAll: 'Hamısına bax',
    addVehicle: 'Avtomobil əlavə et',
    noNameSet: 'Ad təyin edilməyib',
  },

  vehicles: {
    myVehicles: 'Avtomobillərim',
    loadingVehicles: 'Avtomobilləriniz yüklənir…',
    loadError: 'Avtomobilləriniz yüklənə bilmədi: {{error}}',
    emptyTitle: 'Hələ avtomobil əlavə etməmisiniz.',
    emptyCta: 'İlk avtomobilinizi əlavə edin',
    untitled: 'Adsız avtomobil',
    vin: 'VIN',
    lot: 'Lot',
    container: 'Konteyner',
    booking: 'Bron',
    receiver: 'Alıcı',
    shippingLine: 'Daşıma xətti',
    total: 'Ümumi',
    paid: 'Ödənilib',
    added: 'Əlavə edilib',

    addTitle: 'Avtomobil əlavə et',
    detailsTitle: 'Avtomobil məlumatları',
    detailsSubtitle:
      'Yeni avtomobillər “Hərracda” statusu ilə başlayır. Avtomobili növbəti statusa yalnız əməkdaşlarımız keçirə bilər.',
    year: 'İl',
    make: 'Marka',
    model: 'Model',
    lotNumber: 'Lot nömrəsi',
    containerNumber: 'Konteyner nömrəsi',
    bookingNumber: 'Bron nömrəsi',
    totalAmount: 'Ümumi məbləğ (USD)',
    notes: 'Qeydlər',
    photos: 'Şəkillər',
    photoHint: 'JPEG, PNG, WebP və ya AVIF. Hər biri 10 MB-a qədər.',
    removeFile: '{{name}} faylını sil',
    saveVehicle: 'Avtomobili saxla',
    goToMyVehicles: 'Avtomobillərimə keç',
    vYear: '1900 ilə 2100 arasında 4 rəqəmli il daxil edin',
    vVin: 'VIN ən çox 17 simvoldur',
    vAmount: 'Mənfi olmayan məbləğ daxil edin',
    errSession: 'Sessiyanızın vaxtı bitdi. Zəhmət olmasa yenidən daxil olun.',
    errSave: 'Avtomobil saxlanıla bilmədi: {{error}}',
    errNotSaved:
      'Avtomobil saxlanılmadı. Hesabınızın avtomobil əlavə etmək icazəsi olmaya bilər — dəstək xidməti ilə əlaqə saxlayın.',
    warnPhotos:
      'Avtomobil saxlanıldı, lakin bəzi şəkillər əlavə olunmadı: {{errors}}',
  },
}
