export default [
    // 1. Титул
    {
        type: 'hero',
        overline: 'ПРЕЗЕНТАЦИЯ ДЛЯ ИНВЕСТОРОВ 2025',
        title: 'TalentBay',
        subtitle: 'Никаких границ. Только возможности.',
        cta: { text: 'Присоединиться к Pre-ICO →', link: '#' },
        footer: 'www.talentbay.io'
    },
    // 2. Проблема
    {
        type: 'light',
        overline: 'ПРОБЛЕМА',
        title: 'Мир рынка труда сломан',
        blocks: [
            {
                wrapperClass: 'row g-4 mt-2',
                iconList: [
                    { icon: 'Grid', text: '<strong>Фрагментированные источники.</strong> Соискатели часами собирают данные о стоимости жизни, визах и налогах вручную.' },
                    { icon: 'MapPin', text: '<strong>Географические барьеры.</strong> Платформы заточены под локальные рынки. Поиск за рубежом — хаос.' },
                    { icon: 'DollarSign', text: '<strong>Непрозрачные финансы.</strong> Зарплата gross не показывает реальный доход после налогов и расходов.' },
                    { icon: 'Briefcase', text: '<strong>Дорогие платежи.</strong> Международные переводы — комиссии 5–10%, задержки до 5 дней.' },
                    { icon: 'Share2', text: '<strong>Отсутствие единой среды.</strong> LinkedIn + агрегаторы + калькуляторы + визовые сервисы = хаос.' }
                ]
            }
        ]
    },
    // 3. Решение
    {
        type: 'dark',
        overline: 'РЕШЕНИЕ',
        title: 'TalentBay: единая платформа — полная картина',
        subtitle: 'Единственная платформа, которая объединяет поиск работы, расчёт релокации и криптовалютный подход в одну экосистему.',
        blocks: [
            {
                wrapperClass: 'row g-4',
                cards: [
                    { icon: 'Search', heading: 'Найти', description: 'Глобальный поиск работы без географических ограничений и локальных фильтров.' },
                    { icon: 'BarChart2', heading: 'Рассчитать', description: 'Встроенный калькулятор стоимости жизни, релокации и чистого дохода для 80+ городов.' },
                    { icon: 'Zap', heading: 'Получить оплату', description: 'Криптовалюта как приоритетный метод расчётов: быстро, дёшево, без границ.' }
                ]
            }
        ]
    },
    // 4. Для соискателей
    {
        type: 'light',
        overline: 'ДЛЯ СОИСКАТЕЛЕЙ',
        title: 'Как это работает для кандидатов',
        blocks: [
            {
                steps: [
                    { icon: 'UserPlus', label: 'Создал профиль', description: 'Навыки, опыт, желаемый доход', colClass: 'col-md-3' },
                    { icon: 'Sliders', label: 'Указал предпочтения', description: 'Климат, близость к морю, размер города', colClass: 'col-md-2' },
                    { icon: 'Cpu', label: 'Система подобрала', description: 'Вакансии + города по 50+ параметрам', colClass: 'col-md-2' },
                    { icon: 'TrendingUp', label: 'Увидел чистый доход', description: 'Gross → налоги → расходы → остаток', colClass: 'col-md-2' }
                ]
            },
            { text: '<span class="highlight-teal fw-bold">Никаких сюрпризов. Только точные цифры.</span>' }
        ]
    },
    // 5. Для работодателей
    {
        type: 'light',
        overline: 'ДЛЯ РАБОТОДАТЕЛЕЙ',
        title: 'Для работодателей',
        blocks: [
            {
                wrapperClass: 'row g-4',
                cards: [
                    { icon: 'Globe', heading: 'Найм без границ', description: 'Доступ к лучшим талантам планеты без бюрократических барьеров и открытия юрлиц.' },
                    { icon: 'Clipboard', heading: 'Аналитика кандидата', description: 'Данные о релокационных ожиданиях, налоговом статусе и готовности к переезду.' },
                    { icon: 'CheckCircle', heading: 'Крипто-бейдж', description: 'Компании, готовые платить в криптовалюте, получают отметку и привлекают топ-специалистов.' }
                ]
            }
        ]
    },
    // 6. AI-подбор локаций
    {
        type: 'dark',
        overline: 'ТЕХНОЛОГИЯ',
        title: 'AI-подбор локаций',
        subtitle: 'Наш алгоритм анализирует <span class="highlight-teal">50+ параметров</span> для каждого специалиста.',
        blocks: [
            {
                wrapperClass: 'row g-4',
                iconList: [
                    { icon: 'DollarSign', text: '<strong>Финансы:</strong> Налоги для экспатов, средняя зарплата по индустрии, стоимость аренды' },
                    { icon: 'Heart', text: '<strong>Качество жизни:</strong> Безопасность, медицина, экология, климат' },
                    { icon: 'Wifi', text: '<strong>Инфраструктура:</strong> Скорость интернета, наличие коворкингов, транспорт' },
                    { icon: 'BookOpen', text: '<strong>Юридическая доступность:</strong> Визовый режим, сроки ВНЖ, цифровое гражданство' }
                ]
            },
            { text: '<span class="highlight-teal fw-bold">Результат: персональный топ-5 городов для каждого специалиста.</span>' }
        ]
    },
    // 7. Крипто-подход
    {
        type: 'light',
        overline: 'КРИПТО-ПОДХОД',
        title: 'Криптовалюта как приоритет',
        blocks: [
            {
                text: '<strong>TalentBay не является платёжным посредником.</strong> Стороны договариваются об условиях расчётов самостоятельно. Но мы создаём среду, в которой криптовалюта — естественный и приоритетный выбор.'
            },
            {
                wrapperClass: 'row g-4 mt-4',
                iconList: [
                    { icon: 'FileText', text: 'Образовательный контент по крипто-зарплатам' },
                    { icon: 'CheckCircle', text: 'Бейдж «Crypto-Friendly Employer»' },
                    { icon: 'CreditCard', text: 'Интеграция Web3-кошельков для верификации' },
                    { icon: 'Tag', text: 'Скидки до 50% на сервисы при оплате токеном TLB' }
                ]
            }
        ]
    },
    // 8. Бизнес-модель
    {
        type: 'dark',
        overline: 'БИЗНЕС-МОДЕЛЬ',
        title: 'Источники дохода',
        blocks: [
            {
                table: [
                    { icon: 'UserCheck', heading: 'Freemium-подписка', description: 'Базовый доступ бесплатен. Premium — расширенная аналитика, закрытые вакансии.' },
                    { icon: 'Briefcase', heading: 'Работодатели', description: 'Пакетное размещение вакансий + продвижение + доступ к фильтрам.' },
                    { icon: 'Link', heading: 'Корпоративные лицензии', description: 'API-доступ для HR-систем и кадровых агентств.' },
                    { icon: 'DollarSign', heading: 'Токен TLB', description: 'Оплата сервисов со скидкой, стейкинг, эксклюзивный контент.' }
                ]
            }
        ]
    },
    // 9. Токеномика
    {
        type: 'light',
        overline: 'ТОКЕНОМИКА',
        title: 'Токеномика TLB',
        blocks: [
            {
                wrapperClass: 'row g-4',
                tokenCards: [
                    { label: 'Общая эмиссия', value: '500 000 000', note: 'TLB (фиксированная)' },
                    { label: 'Pre-ICO Цена', value: '$0.04', note: 'Скидка 50%' },
                    { label: 'ICO Цена', value: '$0.08' },
                    { label: 'Pre-ICO Hard Cap', value: '$100K' },
                    { label: 'Публичный Hard Cap', value: '$15M' }
                ]
            },
            {
                wrapperClass: 'row mt-4',
                bars: [
                    { label: 'Публичная продажа', value: 35 },
                    { label: 'Резерв платформы', value: 20 },
                    { label: 'Команда и советники', value: 18 },
                    { label: 'Фонд развития', value: 15 },
                    { label: 'Вознаграждения сообщества', value: 12 }
                ],
                footnote: 'Команда: вестинг 24 месяца, cliff 6 месяцев'
            }
        ]
    },
    // 10. Функции токена
    {
        type: 'dark',
        overline: 'ФУНКЦИИ ТОКЕНА',
        title: 'Утилитарные функции токена TLB',
        blocks: [
            {
                wrapperClass: 'row g-4',
                cards: [
                    { icon: 'Key', heading: 'Premium доступ', description: 'Скидка 50% на все платные функции при оплате в TLB' },
                    { icon: 'Lock', heading: 'Стейкинг', description: 'Статус TalentBay Pro, расширенные фильтры, приоритетная поддержка' },
                    { icon: 'Award', heading: 'Эксклюзивный контент', description: 'Вебинары, исследования, консультации по релокации за TLB' },
                    { icon: 'Award', heading: 'Геймификация', description: 'Награды за активность, рефералов и верификацию данных' }
                ]
            }
        ]
    },
    // 11. Использование средств
    {
        type: 'light',
        overline: 'ИСПОЛЬЗОВАНИЕ СРЕДСТВ',
        title: 'Использование привлечённых средств',
        blocks: [
            {
                wrapperClass: 'row align-items-center',
                bars: [
                    { label: 'Разработка продукта', value: 40 },
                    { label: 'Маркетинг и привлечение пользователей', value: 30 },
                    { label: 'Юридическое сопровождение', value: 15 },
                    { label: 'Операционные расходы', value: 10 },
                    { label: 'Резерв', value: 5 }
                ]
            },
            {
                text: '<span class="highlight-teal fw-bold">Основной фокус</span> — создание продукта мирового класса и быстрый захват глобального рынка удалённого рекрутинга.'
            }
        ]
    },
    // 12. Дорожная карта
    {
        type: 'dark',
        overline: 'ДОРОЖНАЯ КАРТА',
        title: 'Roadmap',
        blocks: [
            {
                timeline: [
                    { date: 'Q2 2026', text: 'Pre-ICO', current: true },
                    { date: 'Q3 2026', text: 'MVP + 30 городов' },
                    { date: 'Q4 2026', text: 'Публичный запуск + ICO' },
                    { date: 'Q1 2026', text: 'AI-модуль + мобильные приложения' },
                    { date: 'Q2 2027', text: 'Web3-интеграция + стейкинг' },
                    { date: 'Q3 2027', text: 'API для HR + крипто-раздел' },
                    { date: 'Q4 2027', text: '200+ городов, мультиязычность' },
                    { date: '2028', text: 'Глобальный стандарт' }
                ]
            },
            { badge: '📍 Мы здесь — Q2 2026' }
        ]
    },
    // 13. Преимущества
    {
        type: 'light',
        overline: 'ПРЕИМУЩЕСТВА',
        title: 'Почему TalentBay побеждает',
        blocks: [
            {
                iconList: [
                    { icon: 'Award', text: '<strong>Единственная платформа с полным циклом</strong>&nbsp;Поиск → релокация → крипто-платежи в одном окне.' },
                    { icon: 'Cpu', text: '<strong>Уникальный AI</strong> Рекомендации локаций по 50+ параметрам — аналогов на рынке нет.' },
                    { icon: 'Star', text: '<strong>Крипто-аудитория</strong> Привлекаем самых мобильных и технологически продвинутых специалистов.' },
                    { icon: 'Globe', text: '<strong>Глобальный охват с первого дня</strong> Нет привязки к стране или банковской системе.' },
                    { icon: 'Link', text: '<strong>Партнёрства</strong> Интеграции с Numbeo, Expatistan, государственными миграционными порталами.' }
                ]
            }
        ]
    },
    // 14. Команда
    {
        type: 'light',
        overline: 'КОМАНДА',
        title: 'Команда',
        blocks: [
            {
                team: {
                    members: [
                        { initials: 'SM', name: 'Станислав М.', role: 'CEO & Founder', bio: '12 лет в международном рекрутинге, экс-директор по развитию в топ-5 HR-холдинге Европы.' },
                        { initials: 'MK', name: 'Мария К.', role: 'CTO', bio: 'Архитектор high-load платформ, ранее Senior Architect в HR-tech компании.' },
                        { initials: 'DV', name: 'Дмитрий В.', role: 'Chief Data Scientist', bio: 'PhD в области ML, автор 15 публикаций по рекомендательным системам.' },
                        { initials: 'ES', name: 'Елена С.', role: 'Head of Product', bio: 'Ex-PM топовой фриланс-платформы, специалист по UX-исследованиям.' },
                        { initials: 'IT', name: 'Игорь Т.', role: 'Head of Legal', bio: '10 лет в международном праве, специализация — миграционное законодательство.' },
                        { initials: 'AB', name: 'Advisory Board', role: 'Советники', bio: 'Партнёры венчурных фондов, эксперт по токеномике, экс-CMO глобального HR-портала.' }
                    ]
                }
            }
        ]
    },
    // 15. Заключение
    {
        type: 'hero',
        overline: 'ЗАКЛЮЧЕНИЕ',
        title: 'Присоединяйтесь<br>к будущему работы',
        subtitle: '',
        blocks: [
            { text: '<p class="text-white mb-1"><strong>Pre-ICO открыт</strong></p><p class="big-number mb-1">1 TLB = $0.04</p><p class="body-text-sm" style="color:#B0B8C1;">Hard Cap: $100 000</p>' },
            { cta: { text: 'Присоединиться к Pre-ICO', link: '#' } },
            { text: '<div class="mt-5 pt-4" style="color:var(--cool-gray); font-size:0.9rem;"><p class="mb-1">🌐 www.talentbay.io  |  ✉️ hello@talentbay.io  |  🐦 @talentbay_io</p></div>' }
        ],
        cta: { text: 'Присоединиться к Pre-ICO', link: '#' },
        footer: null
    }
]