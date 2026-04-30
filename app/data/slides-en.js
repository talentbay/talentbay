export default [
    // 1. Hero
    {
        type: 'hero',
        overline: 'INVESTOR PRESENTATION 2025',
        title: 'TalentBay',
        subtitle: 'No Borders. Only Opportunities.',
        cta: { text: 'Join Pre-ICO →', link: '#' },
        footer: 'www.talentbay.io'
    },
    // 2. Problem
    {
        type: 'light',
        overline: 'PROBLEM',
        title: 'The World of Work<br>Is Broken',
        blocks: [
            {
                wrapperClass: 'row g-4 mt-2',
                iconList: [
                    { icon: 'grid', text: '<strong>Fragmented sources.</strong> Job seekers spend hours manually collecting data on cost of living, visas, and taxes.' },
                    { icon: 'map-pin', text: '<strong>Geographic barriers.</strong> Platforms are built for local markets. Searching abroad is chaos.' },
                    { icon: 'dollar-sign', text: '<strong>Opaque finances.</strong> Gross salary doesn\'t show real income after taxes and expenses.' },
                    { icon: 'briefcase', text: '<strong>Expensive payments.</strong> International transfers — 5–10% fees, up to 5 days delay.' },
                    { icon: 'share-2', text: '<strong>No unified environment.</strong> LinkedIn + aggregators + calculators + visa services = chaos.' }
                ]
            }
        ]
    },
    // 3. Solution
    {
        type: 'dark',
        overline: 'SOLUTION',
        title: 'TalentBay: One Platform,<br>Full Picture',
        subtitle: 'The only platform combining job search, relocation calculation, and a crypto-first approach into one ecosystem.',
        blocks: [
            {
                wrapperClass: 'row g-4',
                cards: [
                    { icon: 'search', heading: 'Find', description: 'Global job search without geographic restrictions or local filters.' },
                    { icon: 'bar-chart-2', heading: 'Calculate', description: 'Built-in calculator for cost of living, relocation, and net income for 80+ cities.' },
                    { icon: 'zap', heading: 'Get Paid', description: 'Cryptocurrency as the preferred payment method: fast, cheap, borderless.' }
                ]
            }
        ]
    },
    // 4. For Job Seekers
    {
        type: 'light',
        overline: 'FOR JOB SEEKERS',
        title: 'How It Works for Candidates',
        blocks: [
            {
                steps: [
                    { icon: 'user-plus', label: 'Created Profile', description: 'Skills, experience, desired income', colClass: 'col-md-3' },
                    { icon: 'sliders', label: 'Set Preferences', description: 'Climate, proximity to sea, city size', colClass: 'col-md-2' },
                    { icon: 'cpu', label: 'System Matched', description: 'Jobs + cities based on 50+ parameters', colClass: 'col-md-2' },
                    { icon: 'trending-up', label: 'Saw Net Income', description: 'Gross → taxes → expenses → remainder', colClass: 'col-md-2' }
                ]
            },
            { text: '<span class="highlight-teal fw-bold">No surprises. Only precise numbers.</span>' }
        ]
    },
    // 5. For Employers
    {
        type: 'light',
        overline: 'FOR EMPLOYERS',
        title: 'For Employers',
        blocks: [
            {
                wrapperClass: 'row g-4',
                cards: [
                    { icon: 'globe', heading: 'Borderless Hiring', description: 'Access the world\'s best talent without bureaucratic barriers or establishing legal entities.' },
                    { icon: 'clipboard', heading: 'Candidate Analytics', description: 'Data on relocation expectations, tax status, and willingness to move.' },
                    { icon: 'check-circle', heading: 'Crypto Badge', description: 'Companies ready to pay in crypto get a badge and attract top talent.' }
                ]
            }
        ]
    },
    // 6. AI Location Intelligence
    {
        type: 'dark',
        overline: 'TECHNOLOGY',
        title: 'AI-Powered Location<br>Intelligence',
        subtitle: 'Our algorithm analyzes <span class="highlight-teal">50+ parameters</span> for every professional.',
        blocks: [
            {
                wrapperClass: 'row g-4',
                iconList: [
                    { icon: 'dollar-sign', text: '<strong>Finances:</strong> Expat taxes, average industry salary, rental costs' },
                    { icon: 'heart', text: '<strong>Quality of life:</strong> Safety, healthcare, environment, climate' }
                ],
                extra: [ // two columns
                    { icon: 'wifi', text: '<strong>Infrastructure:</strong> Internet speed, coworking spaces, transport' },
                    { icon: 'book-open', text: '<strong>Legal access:</strong> Visa regime, residence permit terms, digital nomad visas' }
                ]
            },
            { text: '<span class="highlight-teal fw-bold">Result: a personal top-5 cities for each specialist.</span>' }
        ]
    },
    // 7. Crypto Approach
    {
        type: 'light',
        overline: 'CRYPTO APPROACH',
        title: 'Crypto-First Approach',
        blocks: [
            {
                text: '<strong>TalentBay is not a payment intermediary.</strong> The parties agree on payment terms independently. But we create an environment where cryptocurrency is the natural and preferred choice.'
            },
            {
                wrapperClass: 'row g-4 mt-4',
                iconList: [
                    { icon: 'file-text', text: 'Educational content on crypto salaries' },
                    { icon: 'check-circle', text: '«Crypto-Friendly Employer» badge' },
                    { icon: 'credit-card', text: 'Web3 wallet integration for verification' },
                    { icon: 'tag', text: 'Up to 50% discount on services when paying with TLB token' }
                ]
            }
        ]
    },
    // 8. Business Model
    {
        type: 'dark',
        overline: 'BUSINESS MODEL',
        title: 'Revenue Streams',
        blocks: [
            {
                table: [
                    { icon: 'user-check', heading: 'Freemium Subscription', description: 'Basic access is free. Premium — advanced analytics, exclusive vacancies.' },
                    { icon: 'briefcase', heading: 'Employers', description: 'Package job postings + promotion + access to advanced filters.' },
                    { icon: 'link', heading: 'Corporate Licenses', description: 'API access for HR systems and recruitment agencies.' },
                    { icon: 'dollar-sign', heading: 'TLB Token', description: 'Payment for services with discount, staking, exclusive content.' }
                ]
            }
        ]
    },
    // 9. Tokenomics
    {
        type: 'light',
        overline: 'TOKENOMICS',
        title: 'TLB Tokenomics',
        blocks: [
            {
                wrapperClass: 'row g-4',
                tokenCards: [
                    { label: 'Total Supply', value: '500,000,000', note: 'TLB (fixed supply)' },
                    { label: 'Pre-ICO Price', value: '$0.04', note: '50% discount' },
                    { label: 'ICO Price', value: '$0.08' },
                    { label: 'Pre-ICO Hard Cap', value: '$100K' },
                    { label: 'Public Hard Cap', value: '$15M' }
                ]
            },
            {
                wrapperClass: 'row mt-4',
                bars: [
                    { label: 'Public Sale', value: 35 },
                    { label: 'Platform Reserve', value: 20 },
                    { label: 'Team & Advisors', value: 18 },
                    { label: 'Development Fund', value: 15 },
                    { label: 'Community Rewards', value: 12 }
                ],
                footnote: 'Team: 24-month vesting, 6-month cliff'
            }
        ]
    },
    // 10. Token Utility
    {
        type: 'dark',
        overline: 'TOKEN UTILITY',
        title: 'TLB Utility Functions',
        blocks: [
            {
                wrapperClass: 'row g-4',
                cards: [
                    { icon: 'key', heading: 'Premium Access', description: '50% discount on all paid features when paying in TLB' },
                    { icon: 'lock', heading: 'Staking', description: 'TalentBay Pro status, advanced filters, priority support' },
                    { icon: 'award', heading: 'Exclusive Content', description: 'Webinars, research, relocation consultations for TLB' },
                    { icon: 'award', heading: 'Gamification', description: 'Rewards for activity, referrals, and data verification' }
                ]
            }
        ]
    },
    // 11. Use of Funds
    {
        type: 'light',
        overline: 'USE OF FUNDS',
        title: 'Allocation of Funds',
        blocks: [
            {
                wrapperClass: 'row align-items-center',
                bars: [
                    { label: 'Product Development', value: 40 },
                    { label: 'Marketing & User Acquisition', value: 30 },
                    { label: 'Legal & Compliance', value: 15 },
                    { label: 'Operational Expenses', value: 10 },
                    { label: 'Reserve', value: 5 }
                ]
            },
            {
                text: '<span class="highlight-teal fw-bold">Primary focus</span> — building a world-class product and rapidly capturing the global remote recruitment market.'
            }
        ]
    },
    // 12. Roadmap
    {
        type: 'dark',
        overline: 'ROADMAP',
        title: 'Roadmap',
        blocks: [
            {
                timeline: [
                    { date: 'Q2 2026', text: 'Pre-ICO', current: true },
                    { date: 'Q3 2026', text: 'MVP + 30 cities' },
                    { date: 'Q4 2026', text: 'Public launch + ICO' },
                    { date: 'Q1 2027', text: 'AI module + mobile apps' },
                    { date: 'Q2 2027', text: 'Web3 integration + staking' },
                    { date: 'Q3 2027', text: 'HR API + crypto section' },
                    { date: 'Q4 2027', text: '200+ cities, multilingual' },
                    { date: '2028', text: 'Global standard' }
                ]
            },
            { badge: '📍 We Are Here — Q2 2026' }
        ]
    },
    // 13. Advantages
    {
        type: 'light',
        overline: 'ADVANTAGES',
        title: 'Why TalentBay Wins',
        blocks: [
            {
                iconList: [
                    { icon: 'award', text: '<strong>The only full-cycle platform</strong>&nbsp;Search → relocation → crypto payments in one place.' },
                    { icon: 'cpu', text: '<strong>Unique AI</strong> Location recommendations based on 50+ parameters — no analogues on the market.' },
                    { icon: 'star', text: '<strong>Crypto audience</strong> We attract the most mobile and technologically advanced professionals.' },
                    { icon: 'globe', text: '<strong>Global reach from day one</strong> No ties to any country or banking system.' },
                    { icon: 'external-link', text: '<strong>Partnerships</strong> Integrations with Numbeo, Expatistan, government migration portals.' }
                ]
            }
        ]
    },
    // 14. Team
    {
        type: 'light',
        overline: 'TEAM',
        title: 'Team',
        blocks: [
            {
                team: {
                    members: [
                        { initials: 'SM', name: 'Stanislav M.', role: 'CEO & Founder', bio: '12 лет в международном рекрутинге, экс-директор по развитию в топ-5 HR-холдинге Европы.' },
                        { initials: 'MK', name: 'Мария К.', role: 'CTO & Co-founder', bio: 'Архитектор high-load платформ, ранее Senior Architect в HR-tech компании.' },
                        { initials: 'DV', name: 'Дмитрий В.', role: 'Chief Data Scientist', bio: 'PhD в области ML, автор 15 публикаций по рекомендательным системам.' },
                        { initials: 'ES', name: 'Елена С.', role: 'Head of Product', bio: 'Ex-PM топовой фриланс-платформы, специалист по UX-исследованиям.' },
                        { initials: 'IT', name: 'Игорь Т.', role: 'Head of Legal', bio: '10 лет в международном праве, специализация — миграционное законодательство.' },
                        { initials: 'AB', name: 'Advisory Board', role: 'Советники', bio: 'Партнёры венчурных фондов, эксперт по токеномике, экс-CMO глобального HR-портала.' }
                    ]
                }
            }
        ]
    },
// 15. Conclusion / CTA
{
    type: 'hero',
        overline: 'CONCLUSION',
    title: 'Join the Future<br>of Work',
    subtitle: '',
    blocks: [
    { text: '<p class="text-white mb-1"><strong>Pre-ICO Now Open</strong></p><p class="big-number mb-1">1 TLB = $0.04</p><p class="body-text-sm" style="color:#B0B8C1;">Hard Cap: $100,000</p>' },
    { cta: { text: 'Join Pre-ICO', link: '#' } },
    { text: '<div class="mt-5 pt-4" style="color:var(--cool-gray); font-size:0.9rem;"><p class="mb-1">🌐 www.talentbay.io  |  ✉️ hello@talentbay.io  |  🐦 @talentbay_io</p></div>' },
],
    cta: { text: 'Join Pre-ICO', link: '#' }, // will be rendered as button
    footer: null
}
]