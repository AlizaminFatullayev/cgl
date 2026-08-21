import type { Catalogue } from './en'

/**
 * Russian catalogue.
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
export const ru: Catalogue = {
  common: {
    loading: 'Загрузка…',
    save: 'Сохранить',
    saveChanges: 'Сохранить изменения',
    cancel: 'Отмена',
    edit: 'Изменить',
    delete: 'Удалить',
    open: 'Открыть',
    close: 'Закрыть',
    search: 'Поиск',
    optional: 'необязательно',
    signIn: 'Войти',
    signOut: 'Выйти',
    register: 'Регистрация',
    dashboard: 'Панель',
    backToDashboard: 'Вернуться в панель',
    pageNotFound: 'Страница не найдена',
    notAvailable: '—',
    language: 'Язык',
    menu: 'Меню',
    openMenu: 'Открыть меню',
    /**
     * DISPLAY ONLY. The keys are the exact English values stored in
     * vehicles.status, enforced by a CHECK constraint and the
     * guard_vehicle_status trigger. Never translate the stored value, and
     * never use a translated string in a query, filter, insert or comparison.
     */
    status: {
      'At Auction': 'На аукционе',
      'In Transit': 'В пути',
      'At Port': 'В порту',
      'On Ocean': 'В море',
      Delivered: 'Доставлено',
      unknown: 'Неизвестно',
    },
    /** DISPLAY ONLY -- keys are the stored invoice status values. */
    invoiceStatus: {
      unpaid: 'Не оплачен',
      partial: 'Частично оплачен',
      paid: 'Оплачен',
      cancelled: 'Отменён',
    },
    /** DISPLAY ONLY -- 'user' / 'admin' are stored values. */
    role: {
      user: 'Клиент',
      admin: 'Администратор',
    },
  },

  nav: {
    home: 'Главная',
    services: 'Услуги',
    calculator: 'Калькулятор',
    tracking: 'Отслеживание',
    about: 'О нас',
    contact: 'Контакты',
    vehicles: 'Автомобили',
    invoices: 'Счета',
    transactions: 'Операции',
    admin: 'Админ',
  },

  footer: {
    tagline:
      'Надёжная доставка автомобилей с аукционов США в любую точку мира.',
    company: 'Компания',
    tools: 'Инструменты',
    contact: 'Контакты',
    vinTracking: 'Отслеживание по VIN',
    // Physical address -- not translated.
    address: 'Əhməd Rəcəbli küçəsi 3, Narimanov, Bakı',
    rights: '© 2026 Caspian Global Logistics. Все права защищены.',
    builtFor: 'Создано для перевозчиков по всему миру.',
  },

  // TODO(translation): entire `home` block is a working translation of the
  // client's marketing copy -- needs client review before launch.
  home: {
    heroBadge: 'Отслеживание по VIN более 12 000 автомобилей',
    heroTitle: 'Доставка автомобилей из США по всему миру',
    heroSubtitle:
      'От аукционной площадки до вашего двора. Прозрачные цены, отслеживание в реальном времени и команда, которая везёт вашу машину как свою.',
    trackVin: 'Отследить VIN',
    calculateShipping: 'Рассчитать доставку',
    statCarsShipped: 'Доставлено машин',
    statDestinations: 'Направлений',
    statOnTime: 'Доставка в срок',

    dealersEyebrow: 'ВНИМАНИЕ, ДИЛЕРЫ!',
    dealersTitle: '0$ — Все сервисные сборы бесплатно',
    feeDealerService: 'Дилерский сбор',
    feeTransaction: 'Комиссия за транзакцию',
    feeLate: 'Штраф за просрочку',
    feeThc: 'THC',
    feeStorage: 'Хранение',
    feeCarfax: 'Отчёт Carfax',

    whyEyebrow: 'ПОЧЕМУ CASPIAN GLOBAL LOGISTICS',
    // TODO(translation): лимит покрытия 3 000 $ -- требует проверки клиентом.
    whyInsuredTitle: 'Страховка до 3 000 $',
    // TODO(translation): лимит покрытия 3 000 $ -- требует проверки клиентом.
    whyInsuredBody:
      'Страховка бесплатна до 3 000 $ — автомобиль защищён от двери до порта.',
    whyAccountsTitle: 'Оригинальные аккаунты IAAI и Copart',
    whyAccountsBody:
      'У нас есть проверенные дилерские аккаунты на IAAI и Copart — ставки напрямую, без посредников.',
    whyTransporterTitle: 'Автовоз за 350$',
    whyTransporterBody:
      'Фиксированные 350$ за внутреннюю перевозку от аукционной площадки до нашего порта — одна из самых низких ставок на рынке.',
    whyRatesTitle: 'Лучшие тарифы',
    whyRatesBody:
      'Прямые контракты с перевозчиками означают более низкие цены без скрытых сборов.',

    stepsEyebrow: 'КАК ЭТО РАБОТАЕТ',
    stepsTitle: 'Четыре простых шага до вашего двора',
    step1Title: 'Найти и купить',
    step1Body:
      'Выберите автомобиль на любом аукционе США. Мы делаем ставку или принимаем ваш VIN.',
    step2Title: 'Забор и внутренняя перевозка',
    step2Body: 'От аукционной площадки до порта погрузки за 5–7 дней.',
    step3Title: 'Погрузка в порту',
    step3Body: 'Контейнер или RoRo. Погрузка под видеонаблюдением.',
    step4Title: 'Доставка морем',
    step4Body:
      'Морская перевозка, таможенное оформление и финальная доставка.',

    reviewsEyebrow: 'ОТЗЫВЫ',
    reviewsTitle: 'Нам доверяют импортёры по всему миру',
    // Names and cities stay as written -- only the quoted text is translated.
    review1:
      'Забрали мою Tesla с Copart и доставили в Баку за 38 дней. Обновления отслеживания на каждом этапе.',
    review2:
      'Лучшая цена, которую я нашёл. Калькулятор точно совпал с итоговым счётом.',
    review3:
      'Всё прошло гладко. Команда отвечала на каждый вопрос за считаные минуты.',

    faqEyebrow: 'FAQ',
    faqTitle: 'Вопросы и ответы',
    faq1Q: 'Сколько занимает доставка?',
    faq1A:
      'TODO(content): типичные сроки доставки до порта и морского перехода по направлениям.',
    faq2Q: 'Занимаетесь ли вы таможенным оформлением?',
    faq2A:
      'TODO(content): для каких направлений мы проходим таможню и что должен предоставить клиент.',
    faq3Q: 'Что включает калькулятор?',
    faq3A:
      'TODO(content): уточнить, какие этапы и сборы покрывает опубликованный тариф.',
    faq4Q: 'Могу ли я отслеживать автомобиль в реальном времени?',
    faq4A:
      'TODO(content): описать, как работает отслеживание по VIN и когда обновляются статусы.',

    contactEyebrow: 'КОНТАКТЫ',
    contactTitle: 'Получите расчёт за минуты',
    contactSubtitle:
      'Расскажите о вашей перевозке. Наша команда отвечает в течение одного рабочего часа.',
    callUs: 'Позвоните нам',
  },

  // TODO(translation): entire `services` block -- needs client review.
  services: {
    eyebrow: 'УСЛУГИ',
    title: 'Всё необходимое для импорта автомобиля',
    subtitle:
      'От аукционной площадки до вашей двери Caspian Global Logistics берёт на себя каждый этап пути.',
    biddingTitle: 'Ставки на аукционе',
    biddingBody:
      'Copart и IAAI — делаем ставки вживую или принимаем выигранный вами лот.',
    truckingTitle: 'Внутренние перевозки',
    truckingBody:
      'Забор с площадки до порта погрузки за 5–7 дней по всей стране.',
    loadingTitle: 'Погрузка в порту',
    loadingBody:
      'Контейнер, RoRo или консолидированная погрузка в крупных портах США.',
    insuranceTitle: 'Страхование груза',
    // TODO(translation): лимит покрытия 3 000 $ -- требует проверки клиентом.
    insuranceBody:
      'Бесплатное покрытие от всех рисков от площадки до порта, до 3 000 $.',
    customsTitle: 'Таможня и документы',
    customsBody:
      'Оформление тайтла, коносамент и поддержка на таможне в стране назначения.',
  },

  // TODO(translation): entire `about` block -- needs client review.
  about: {
    eyebrow: 'О НАС',
    titleLead: 'Перевозим автомобили через океаны, ',
    titleTail: 'один VIN за раз',
    p1: 'Caspian Global Logistics (CGL) — официально зарегистрированная логистическая компания в форме ООО, построенная на многолетнем опыте импорта автомобилей и прочных международных партнёрствах.',
    p2: 'Наша цель — предоставлять клиентам прозрачные, надёжные и комфортные услуги импорта автомобилей. Именно поэтому мы предоставляем клиентам оригинальные аукционные аккаунты — это защищает их от посредников и лишних рисков и обеспечивает максимальный комфорт в процессе торгов.',
    // TODO(translation): лимит покрытия 3 000 $ -- требует проверки клиентом.
    p3: 'Наша компания предлагает услуги импорта автомобилей с полной гарантией, бесплатной страховкой до 3 000 $ и конкурентными ценами на перевозку. В наших ценах нет скрытых или дополнительных сборов.',
    p4: 'Мы искренне благодарим всех наших клиентов за доверие.',
    sincerely: 'С уважением,',
    management: 'Руководство CGL',
    statPorts: 'Портов назначения',
    statClients: 'Довольных клиентов',
    statYears: 'Лет опыта',
    statOnTime: 'Доставка в срок',
  },

  contact: {
    name: 'Имя',
    email: 'Эл. почта',
    vin: 'VIN',
    message: 'Сообщение',
    send: 'Отправить сообщение',
    sentTitle: 'Сообщение отправлено',
    sentBody:
      'Спасибо — мы получили ваше сообщение и ответим вам по электронной почте.',
    sendAnother: 'Отправить ещё одно сообщение',
    errorPrefix:
      'Не удалось отправить сообщение: {{error}}. Пожалуйста, попробуйте ещё раз.',
    vNameMin: 'Введите ваше имя',
    vEmail: 'Введите корректный адрес эл. почты',
    vVinMax: 'VIN содержит не более 17 символов',
    vMessageMin: 'Расскажите подробнее (10+ символов)',
  },

  calculator: {
    eyebrow: 'Стоимость перевозки',
    title: 'Калькулятор доставки',
    subtitle:
      'Выберите штат и филиал аукциона, чтобы увидеть итоговую стоимость перевозки. Тарифы берутся из нашей опубликованной таблицы.',
    loadingRates: 'Загрузка тарифов…',
    loadError: 'Не удалось загрузить тарифы: {{error}}',
    noRates: 'Тарифы пока недоступны. Таблица тарифов не заполнена.',
    routeTitle: 'Маршрут',
    routeSubtitle: 'Шаг 1: выберите штат. Шаг 2: выберите филиал аукциона.',
    state: 'Штат',
    branch: 'Филиал',
    selectState: 'Выберите штат',
    selectBranch: 'Выберите филиал',
    selectStateFirst: 'Сначала выберите штат',
    searchStateHint: 'Введите название или код — и "AL", и "Alab" находят Alabama.',
    searchBranchHint: 'Введите любую часть названия филиала.',
    noMatch: 'Ничего не найдено по запросу "{{query}}".',
    stepOne: 'Шаг 1',
    stepTwo: 'Шаг 2',
    routeSummary: 'Маршрут',
    noBranches: 'В этом штате нет филиалов с опубликованным тарифом.',
    totalTitle: 'Итого за перевозку',
    totalFinal: 'Окончательная цена — дополнительные сборы не добавляются.',
    totalPrompt: 'Выберите штат и филиал, чтобы увидеть цену.',
  },

  tracking: {
    eyebrow: 'ОТСЛЕЖИВАНИЕ',
    title: 'Отследите ваш автомобиль',
    subtitle: 'Введите 17-значный VIN, чтобы увидеть текущий статус.',
    track: 'Отследить',
    vinLength: 'VIN содержит ровно 17 символов.',
    lookupError: 'Не удалось выполнить поиск: {{error}}',
    notFoundTitle: 'Не найдено или недоступно',
    notFoundBody:
      'Мы не нашли автомобиль с таким VIN, доступный вам для просмотра. Если это ваша машина, сначала войдите — отслеживание показывает автомобили только на вашем аккаунте.',
    container: 'Контейнер',
    booking: 'Букинг',
    added: 'Добавлено',
    timeline: 'История статусов',
    current: 'Текущий',
  },

  auth: {
    signInTitle: 'Вход',
    signInSubtitle: 'Войдите в вашу панель импорта автомобилей.',
    registerTitle: 'Создать аккаунт',
    registerSubtitle: 'Начните отслеживать импорт ваших автомобилей.',
    fullName: 'Имя и фамилия',
    email: 'Эл. почта',
    password: 'Пароль',
    createAccount: 'Создать аккаунт',
    noAccount: 'Нет аккаунта?',
    alreadyRegistered: 'Уже зарегистрированы?',
    checkEmailTitle: 'Проверьте почту',
    checkEmailBody:
      'Мы отправили вам ссылку для подтверждения. Подтвердите адрес, затем войдите.',
    goToSignIn: 'Перейти ко входу',
    vEmail: 'Введите корректный адрес эл. почты',
    vPasswordRequired: 'Введите пароль',
    vPasswordMin: 'Пароль должен содержать не менее 8 символов',
    vFullName: 'Введите имя и фамилию',
  },

  dashboard: {
    title: 'Панель',
    account: 'Аккаунт',
    balance: 'Баланс',
    balanceHint: 'Управляется нашими сотрудниками.',
    vehicles: 'Автомобили',
    viewAll: 'Показать все',
    addVehicle: 'Добавить автомобиль',
    noNameSet: 'Имя не указано',
  },

  vehicles: {
    myVehicles: 'Мои автомобили',
    loadingVehicles: 'Загрузка ваших автомобилей…',
    loadError: 'Не удалось загрузить ваши автомобили: {{error}}',
    emptyTitle: 'Вы ещё не добавили ни одного автомобиля.',
    emptyCta: 'Добавить первый автомобиль',
    untitled: 'Автомобиль без названия',
    vin: 'VIN',
    lot: 'Лот',
    container: 'Контейнер',
    booking: 'Букинг',
    receiver: 'Получатель',
    shippingLine: 'Линия перевозки',
    total: 'Итого',
    paid: 'Оплачено',
    added: 'Добавлено',

    addTitle: 'Добавить автомобиль',
    detailsTitle: 'Данные автомобиля',
    detailsSubtitle:
      'Новые автомобили начинают со статуса «На аукционе». Перевести автомобиль в следующий статус могут только наши сотрудники.',
    year: 'Год',
    make: 'Марка',
    model: 'Модель',
    lotNumber: 'Номер лота',
    containerNumber: 'Номер контейнера',
    bookingNumber: 'Номер букинга',
    totalAmount: 'Общая сумма (USD)',
    notes: 'Заметки',
    photos: 'Фотографии',
    photoHint:
      'JPEG, PNG, WebP или AVIF. Выбирайте сколько нужно — большие фото уменьшаются в браузере перед загрузкой.',
    photoAddMore: 'Добавить ещё фото',
    photoSelected_one: 'Выбрано {{count}} фото',
    photoSelected_other: 'Выбрано {{count}} фото',
    photoStatePending: 'Ожидает',
    photoStateCompressing: 'Уменьшается…',
    photoStateUploading: 'Загружается…',
    photoStateDone: 'Загружено',
    photoStateFailed: 'Ошибка',
    photoCompressedTo: '{{from}} → {{to}}',
    photoRetryFailed: 'Повторить неудачные',
    photoSummary: 'Загружено {{done}} из {{total}}, ошибок: {{failed}}.',
    photoRemove: 'Удалить {{name}}',
    errPhotoHeic:
      '{{name}}: HEIC не читается в браузере. Экспортируйте в JPEG и попробуйте снова.',
    errPhotoType: '{{name}}: неподдерживаемый формат ({{type}}). Используйте JPEG, PNG, WebP или AVIF.',
    errPhotoTooLarge:
      '{{name}} — {{size}}, это больше лимита {{limit}} даже после уменьшения.',
    removeFile: 'Удалить {{name}}',
    saveVehicle: 'Сохранить автомобиль',
    goToMyVehicles: 'Перейти к моим автомобилям',
    vYear: 'Введите год из 4 цифр от 1900 до 2100',
    vVin: 'VIN содержит не более 17 символов',
    vAmount: 'Введите неотрицательную сумму',
    errSession: 'Сессия истекла. Пожалуйста, войдите снова.',
    errSave: 'Не удалось сохранить автомобиль: {{error}}',
    errNotSaved:
      'Автомобиль не сохранён. Возможно, у вашего аккаунта нет прав на добавление автомобилей — обратитесь в поддержку.',
    warnPhotos:
      'Автомобиль сохранён, но некоторые фотографии не прикрепились: {{errors}}',

    editTitle: 'Редактировать автомобиль',
    editSubtitle:
      'Исправьте введённые вами данные. Статус, суммы и поля, которыми управляют наши сотрудники, доступны только для чтения — если там ошибка, свяжитесь с нами.',
    adminManagedField: 'Управляется нашими сотрудниками.',
    loadingVehicle: 'Загрузка автомобиля…',
    errLoadVehicle: 'Не удалось загрузить автомобиль: {{error}}',
    errVehicleNotFound:
      'Этот автомобиль не найден в вашем аккаунте. Возможно, он был удалён.',
    errUpdate: 'Не удалось сохранить изменения: {{error}}',
    errNotUpdated:
      'Изменения не сохранены. База данных отклонила обновление — обновите страницу и попробуйте снова или обратитесь в поддержку.',
    currentPhotos: 'Текущие фотографии',
    photoRemoveExisting: 'Удалить',
    photoUndoRemove: 'Оставить',
    photoRemovePending_one: 'При сохранении будет удалена {{count}} фотография.',
    photoRemovePending_other: 'При сохранении будет удалено фотографий: {{count}}.',
    errPhotoRemoveBlocked:
      'Не удалось удалить фотографии. Возможно, у вашего аккаунта нет прав.',
    warnPhotoRemove:
      'Изменения сохранены, но фотографии не удалось удалить: {{error}}',
  },

  cars: {
    title: 'Мои автомобили',
    subtitle: 'Каждый автомобиль на вашем счёте и его полное досье.',
    loading: 'Загрузка ваших автомобилей…',
    loadError: 'Не удалось загрузить ваши автомобили: {{error}}',
    empty: 'У вас пока нет автомобилей.',
    noMatch: 'В этой локации нет автомобилей.',
    countLabel: '{{shown}} из {{total}} автомобилей',

    locationFilter: 'Локация',
    locationAll: 'Все',
    location: {
      Auction: 'Аукцион',
      Warehouse: 'Склад',
      Container: 'Контейнер',
      Parking: 'Парковка',
      Out: 'Выдан',
    },

    colId: 'ID',
    colRegistered: 'Дата регистрации',
    colAuctionDate: 'Tracking ID',
    colVin: 'Vin',
    colLot: 'Лот',
    colCar: 'Автомобиль',
    colDebt: 'Долг',
    colPenalty: 'Штраф аукциона',
    colStatus: 'Статус автомобиля',
    colOpening: 'Ожидаемая дата открытия',
    colImage: 'Фото',
    colActions: 'Действия',

    details: 'Подробнее',
    hideDetails: 'Скрыть подробности',
    detailsFor: 'Подробности: {{car}}',
    openGallery: 'Открыть галерею фотографий',
    galleryTitle: 'Галерея фотографий автомобиля',

    cardCar: 'Информация об автомобиле',
    cardAuction: 'Информация об аукционе',
    cardTransport: 'Информация о перевозке',

    car: 'Автомобиль',
    finalPrice: 'Итоговая цена',
    client: 'Клиент',
    personalNumber: 'Личный номер',
    auction: 'Аукцион',
    state: 'Штат',
    city: 'Город',
    loadingPort: 'Порт погрузки',
    carrier: 'Перевозчик',
    auctionPickupDate: 'Дата вывоза с аукциона',
    warehouseDeliveryDate: 'Дата доставки на склад',
    departureDate: 'Дата отправления',
    entryDate: 'Дата прибытия',
    containerNumber: 'Номер контейнера',
    openDate: 'Дата открытия',
    seaLine: 'Морская линия',
    terminal: 'Терминал',
    releaseDate: 'Дата выдачи',
  },

  photos: {
    category: {
      auction: 'Аукцион',
      stock: 'Склад',
      driver: 'Водитель',
      poti: 'Поти',
    },
    categoryEmpty: 'Нет фотографий',
    changeCategory: 'Переместить фотографию {{index}} в другую категорию',
    viewerTitle: 'Фотографии: {{vehicle}}',
    openViewer: 'Открыть фотографию {{index}} из {{total}}',
    photoAlt: '{{vehicle}} — фотография {{index}} из {{total}}',
    counter: '{{index}} / {{total}}',
    previous: 'Предыдущая фотография',
    next: 'Следующая фотография',
    zoomIn: 'Увеличить',
    zoomOut: 'Уменьшить',
    resetZoom: 'Сбросить масштаб',
    close: 'Закрыть',
    loading: 'Загрузка фотографий…',
    none: 'Фотографий пока нет.',
    loadFailed:
      'Не удалось загрузить фотографию. Возможно, ссылка устарела — попробуйте снова.',
    retry: 'Попробовать снова',
  },
}
