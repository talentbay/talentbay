# TalentBay: подробный backlog до MVP

Дата: 2026-10-26. Статус: **предложен; исполнение после согласования плана и модели**.
Контекст/границы: [маршрут](23-mvp-delivery-plan.md). Все задачи ниже пока не выполнены
в рамках этого маршрута; уже имеющийся код проверяется и дополняется, не переписывается.

## Как читать и исполнять

- 47 задач A–H/R; X01–X06 — отдельные post-beta предложения, не текущий autonomous scope.
- AUTO — код/документы/изолированные проверки в разрешённом repo; без реальной рассылки.
  GATE — внешнее разрешение/данные/участие человека. REVIEW — отдельный независимый запуск.
- S/M/L — относительная сложность. Не часы, не стоимость API и не обещанный календарь.
- Начальная очередь READY: TB-A01, TB-A03, TB-A04. Остальные становятся READY после
  dependencies; в GATE дополнительно нужно выполнить названное внешнее условие.
- До старта задачи указать её ID, scope, baseline и проверку. На выходе: diff/commit/PR,
  команды и реальные результаты, ограничения и следующее действие в execution log.
- Для каждого кодового среза действуют AGENTS и общий DoD из маршрута. Миграция идёт
  вместе со схемой и тестами. Для UI нужны loading/empty/error/retry, narrow/wide и a11y.
- Здесь хранятся task contracts. До A05 текущая очередь/состояния находятся в execution
  log; после A05 — в Issues/Project, а execution log хранит evidence и ссылку. Не вести
  два конкурирующих списка текущих статусов. При недоступном GitHub явно отметить unsynced.

## A. Управляемая основа

### TB-A01 — Разобрать PR stack и выбрать integration ref

Зависимости: нет.
Режим: AUTO. Сложность: S. Приоритет: P0.

- Работы: проверить live main/head/ancestry #25–#36 и отсутствие чужих неперенесённых
  изменений; зафиксировать один cumulative baseline, integration ref и порядок review.
  Учесть автоматический deployment main до любого merge. #24 не интегрировать.
- Выход: короткая таблица «коммит → feature → PR → проверка», правила будущих topic PR
  и безопасная процедура обработки старых cumulative PR после финального решения.
- Модули: Git/PR metadata, `docs/14-mvp-execution.md`, `docs/06-infrastructure-and-process.md`.
- Готово: выбранный integration ref содержит все нужные commits ровно один раз;
  не выполнены blind squash/force push/закрытие PR или production merge.

### TB-A02 — CI для действительного рабочего потока

Зависимости: TB-A01.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: устранить main-only PR filter для выбранной integration стратегии; сохранить
  readonly GITHUB_TOKEN, disposable PostgreSQL, explicit typecheck, оба browser набора,
  Node/Vercel build checks и запрет shared credentials. Не добавлять competing CD.
- Модули: `.github/workflows/ci.yml`, scripts/assert-ci-database, test configs.
- Проверки: CI на небольшом PR к выбранной базе; негативные safety tests; отсутствие
  облачных secrets и mutation прав. Branch checks требовать только реально существующие.
- Готово: topic PR запускает весь нужный CI, результат относится к его exact head SHA;
  ни main, ни deployment защиты не ослаблены.

### TB-A03 — Свежий dependency/security baseline

Зависимости: нет.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: проверить locked tree/engines и актуальные официальные advisories; отделить
  default-branch alerts от текущей ветки, production exposure от tooling. Подтверждённые
  риски исправлять узкими совместимыми патчами, не полным обновлением стека.
- Модули: package/lock, auth/security tests, `docs/16-security-review.md`.
- Проверки: lockfile frozen install, audit/reachability evidence, types/lint/tests/build,
  real-library regression для затронутого security boundary.
- Готово: известные release-blocking findings исправлены или явно заблокировали release;
  нет заявления «0 уязвимостей» по одному старому отчёту/неполученному registry ответу.

### TB-A04 — Подготовить environment/операционный паспорт

Зависимости: нет.
Режим: AUTO. Сложность: S. Приоритет: P1.

- Работы: свести local synthetic / disposable CI / controlled preview / production,
  допустимые операции, secret names без значений, callback origins, runtime и rollback.
  Проверить drift README/local docs/runbook: июльский shared-Neon тест не default сегодня.
- Модули: README, `.env.example`, docs03/06/11/20. Не читать/копировать `.env`.
- Проверки: чистый checkout с lockfile и `pnpm dev:review` даёт полный synthetic путь;
  production output не содержит chooser/test identities.
- Готово: новый разработчик понимает запуск без Telegram и не запускает shared migrations
  или тесты с production URL по инструкции по умолчанию.

### TB-A05 — Перевести согласованный маршрут в рабочую очередь

Зависимости: TB-A01.
Режим: AUTO. Сложность: S. Приоритет: P1.

- Работы: после принятия scope создать/переиспользовать один GitHub Project и repository
  Issues по ID; настроить Current/Backlog/Blocked/Review/Roadmap, milestones K1/K2/K3.
  Не дублировать существующие Issues; не назначать людям сроки/нагрузку самостоятельно.
- Выход: связанные tasks, dependencies, gates, complexity, acceptance, PR/verification SHA.
- Проверки: число/ID без дублей, blocker не попадает в READY, все обязательные задачи
  имеют exit criterion; следующий task находится без чтения полного чата.
- Готово: одна актуальная очередь и понятный integration writer, не три конкурирующих доски.
  Если org Projects недоступен, сохраняется явный fallback в execution log/repo Issues;
  запись о недостающем праве не блокирует независимую разработку и не выдаётся за настроенную доску.

## B. Заявка, которую TalentBay действительно сопровождает

### TB-B01 — Зафиксировать lifecycle и disclosure contract

Зависимости: TB-A01.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: state/transition table: получено → внутренняя работа → контакт компании →
  кандидат представлен → follow-up/завершение; outcome причины отдельно от стадии найма.
  Минимальный контакт/пакет, candidate-visible поля, internal notes, legacy и withdrawal.
- Предложение: отдельный handling stage и append-only events с actor/time/revision;
  точные имена согласовать контрактом здесь, не переиспользовать employer VIEWED.
  Append-only относится к обычным операциям, а не вечному хранению PII вопреки отдельно
  согласованной retention/redaction процедуре.
- Модули: docs22, shared/types/application-review; входной state contract для эскиза E01.
- Готово: для каждого действия известны actor, данные, preconditions, идемпотентность,
  UI-сообщение и отрицательный тест. Business assumptions отмечены; legal text не объявлен
  approved. Нет обязанности компании отвечать/нанимать.

### TB-B02 — Backward-compatible хранение snapshot и handling events

Зависимости: TB-A02, TB-B01, TB-E01.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: минимальный immutable snapshot новой заявки и recipient/vacancy context;
  handling/event storage, operator ownership, event keys/revisions, необходимые indexes.
  Отделить internal/publishable payload; не создавать полную CRM и universal event bus.
- Модули: db/schema, committed migrations/meta, shared contracts, integration tests.
- Проверки: миграция с нуля и с предыдущих synthetic rows, user/application ID preservation,
  uniqueness/FK/indexes, transaction rollback, запрет фиктивного snapshot для старых rows.
- Готово: старые записи читаются как legacy; новые данные добавляются без потери старых,
  нет production migration и destructive down migration как «отката».

### TB-B03 — Новый Apply с серверным snapshot и контактным preflight

Зависимости: TB-B02.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: сервер получает профиль/контакт/вакансию, валидирует минимальный согласованный
  пакет и disclosure version; создаёт application + receipt event + snapshot атомарно.
  В UI показать, кому/зачем направляется заявка и какие данные использует TalentBay.
- Модули: vacancy applications POST, candidate service, VacancyActions/ProfileEditor.
- Проверки: no-contact/invalid/version errors, public visibility/demo rejection, CSRF,
  double/concurrent submit, profile edit после Apply не изменяет snapshot, auth switch.
- Готово: новый кандидат осознанно отправил одну заявку; ошибка сохраняет ввод;
  отсутствуют выдуманные verified contact/согласия старых пользователей.

### TB-B04 — Безопасные operator команды и конкурентная обработка

Зависимости: TB-B03.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: взять/передать ответственному действующему ADMIN, начать работу, записать
  контакт/результат/follow-up. Ограниченные inputs, same-origin, current-role, locks,
  expected revision и idempotency; append-only события с исправлением новым событием.
- Модули: admin API/services/application handling, shared contracts, SQL/HTTP tests.
- Проверки: два оператора/stale read, revoked admin, forbidden transition, oversized body,
  повтор после timeout, withdrawal race. Обоснованные ошибки не теряют action draft.
- Готово: action имеет реальный actor/time; чтение не мутирует статус, private notes
  не попадают в candidate API; нет silent overwrite или двойного бизнес-события.

### TB-B05 — Рабочая очередь оператора

Зависимости: TB-B04.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: дополнить существующие inbox/detail: новые/мои/в работе/завершённые, назначение,
  явные actions, причина/следующий шаг, связанный профиль/вакансия и bounded pagination.
  Ничего не отправлять при открытии записи; чужие несохранённые данные не затирать.
- Модули: `app/pages/ktulhu/v1/applications.vue`, admin components/navigation.
- Проверки: реальные API/PG transitions в browser, empty/error/retry/conflict, 320/wide,
  клавиатура и отзыв роли в уже открытой вкладке.
- Готово: оператор без SQL находит заявку и выполняет следующее корректное действие;
  это focused workflow, не весь deferred admin redesign.

### TB-B06 — Минимальный пакет кандидата и фиксация ручной передачи

Зависимости: TB-B04.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: preview разрешённого snapshot/полей для конкретной компании; явное действие
  человека для подготовки/копирования пакета и отдельная запись фактически выполненной
  передачи с каналом/временем/reference. Ручная запись не равна доставке/прочтению.
- Legacy без disclosure/snapshot не получает share action до подтверждения по контракту.
  Открытых profile URLs, массовых PII-экспортов и автоматического email/bot sender нет.
- Модули: operator detail, handling command service, candidate-safe event projection.
- Проверки: withdrawn/changed vacancy/permission/version deny, privacy payload allowlist,
  replay/concurrency; копирование не ставит событие «передано» само по себе.
- Готово: в synthetic тесте человек контролирует состав/адресата; запись проверяема.
  Для реальных профилей ещё нужен G05 и разрешённый человек/канал, агент не рассылает их.

### TB-B07 — Candidate progress и ограниченный список заявок

Зависимости: TB-B04.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: показать этап работы TalentBay, следующий шаг и только реально записанные
  публичные события; различать employer stage, recorded handoff, internal review.
  Добавить bounded pagination с сохранением active/closed контекста и ownership.
- Модули: candidate applications API/services/types, `/applications`, status presenters.
- Проверки: чужая заявка/event, legacy/current snapshot, hidden notes, reload/page/filter,
  длинные подписи и timestamp/timezone, zero/one/many rows.
- Готово: кандидат понимает не только «мы сохранили заявку», но текущую работу команды;
  история начинается там, где события появились, а не доизобретена из updatedAt.

### TB-B08 — Withdrawal, закрытие вакансии и невозможный контакт

Зависимости: TB-B05, TB-B06, TB-B07.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: состыковать существующий withdrawal с handling/share commands; вакансия закрыта,
  компания не отвечает, контакт недоступен, кандидат отказался. Для каждой ситуации
  конкретная причина/действие; не ставить REJECTED от имени работодателя без основания.
- Проверки: withdraw против share/update, double withdrawal, после recorded handoff,
  archive/re-import при живой заявке; данные и связь не удаляются ради удобства.
- Готово: дальнейшие in-product передачи прекращаются; уже сделанная внешняя передача
  объясняется честно, приложена процедура ручного обращения/исправления.

### TB-B09 — Полный operator/candidate acceptance suite

Зависимости: TB-B08.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: воспроизводимый seed/chooser для новой, взятой, переданной, закрытой и legacy
  заявки; browser путь candidate → operator → candidate с реальными API/SQL.
- Модули: tests/integration, tests/e2e, scripts/local-review, docs21/22.
- Проверки: positive/negative/concurrency и recovery cases B01, screenshots narrow/wide,
  отсутствие реальных контактов/доставки в fixtures, tests не пишут в shared DB.
- Готово: любой reviewer воспроизводит весь путь, а не видит только два гостевых экрана.

## C. Вакансии и содержание

### TB-C01 — Реестр источников и pilot content contract

Зависимости: TB-A01.
Режим: AUTO. Сложность: M. Приоритет: P1.

- Работы: перечислить источники/URL, условия использования/официальный API, стабильные
  идентификаторы, покрытие/частоту обновления/владельца проверки. Исследование не равно
  approval на republication. Отдельно проверить пригодность ранее присланного ai-job-search,
  не клонировать/запускать чужой код без проверки лицензии/данных/безопасности.
- Выход: source register с proposed/approved/rejected и dated evidence, sample schema.
- Готово: понятно, что можно исследовать, что загружать только после одобрения и какие
  вакансии подходят аудитории. Массового scraping/CAPTCHA обхода/AI генерации вакансий нет.

### TB-C02 — Дочитать все Jobs, не потеряв контекст

Зависимости: TB-A02.
Режим: AUTO. Сложность: M. Приоритет: P1.

- Работы: проверить существующий query/index plan; добавить bounded pagination/load-more
  с устойчивым order/tie-breaker, search/filter/sort URL и back/scroll restoration.
- Модули: public vacancy service/repository/API, shared vacancy types, Jobs composable/UI.
- Проверки: >50 synthetic rows, одинаковые даты, фильтры/источники/visibility, invalid
  cursor/limit, concurrent archive, no duplicates на стабильном наборе, SSR первой страницы.
- Готово: отсутствие результата не вызвано скрытым hard cap; mixed currency salary sorting
  не превращается в выдуманное сравнение доходов. Нет отдельного search engine.

### TB-C03 — Ограниченные, но полные admin очереди

Зависимости: TB-A02.
Режим: AUTO. Сложность: M. Приоритет: P1.

- Работы: страницы очереди вакансий/пользователей при росте данных; filters и URL, selected
  record context, meaningful count/limit. Reuse application queue, не переписывать её.
- Модули: существующие admin list endpoints/services/pages.
- Проверки: >100 records, last page, filters, revoked-role/no-store, narrow overflow,
  переход из dashboard в правильную очередь.
- Готово: оператор может найти все нужные записи без выдачи бесконечного PII dataset.

### TB-C04 — Свежесть и обслуживание контента

Зависимости: TB-C01.
Режим: AUTO. Сложность: M. Приоритет: P1.

- Работы: определить source publication/check dates и ответственного; объяснить отличие
  даты исходника, импорта и реальной проверки. Обновление/flag/archive из existing workflow;
  исправления через fixed CSV достаточны, universal editor не требуется.
- Проверки: unchanged re-import сохраняет публикацию; changed снимает review, company
  change затрагивает siblings, archived company не оживает, application IDs сохранены.
- Готово: просроченный/недоступный источник не получает ложный freshness badge; нет
  автоматического «просрочено через N дней» без определённой политики и данных.

### TB-C05 — Разрешённый real pilot dataset

Зависимости: TB-C02, TB-C03, TB-C04, TB-H02, TB-G05.
Режим: GATE. Сложность: M. Приоритет: P0.

- Условие: конкретные источники/объём разрешены владельцем, reviewed target preview
  и загрузка в него одобрены. Никаких production seed по этой задаче.
- Работы: подготовить CSV, validate → dry-run → import → human review → publish; источник,
  company/title/salary/location/support claims сверены, demo не выдать за настоящего работодателя.
- Проверки: public/detail/count/resolve, archive и повторный import без потери заявок;
  дата загрузки/источник/проверяющий в evidence, без приватных файлов/ключей.
- Готово: на preview есть согласованное полезное наполнение, не synthetic demonstration.

## D. Relocation: данные, формула, доверие

### TB-D01 — География и data contract

Зависимости: TB-A01.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: предложить приоритетные города из фактических вакансий/старого списка, не
  объявлять все 20 стран обязательными. Поля: валюта/период, living/one-time categories,
  источник/дата, допущения налоговой модели, условия и reviewed/stale status.
- Выход: fixed dataset schema/example на synthetic values, source checklist, reviewer
  responsibility; live quote и оценка переезда различены.
- Готово: любой номер имеет единицу/период/происхождение или явно отсутствует; rent/flight
  не названы актуальным предложением бронирования. Финальный city set остаётся gate.

### TB-D02 — Валидация данных и границ расчёта

Зависимости: TB-A02, TB-D01.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: сохранить существующие calculator/query APIs; добавить строгий dataset validator,
  finite/nonnegative/range проверки, tax bracket ordering/terminal bracket/rates,
  effective/review dates и currency/period assumptions. Не усложнять модель без источников.
- Модули: relocation services/repository/types и unit/SQL contracts.
- Проверки: zero/boundary/high income, allowance/brackets, неверные/несортированные данные,
  monthly annualization, hourly input, mismatch валют, rounding, negative disposable.
- Готово: неизвестное/неподдерживаемое не превращается в точный net income; испорченный
  VERIFIED DB record не выдаётся за правильную математику.

### TB-D03 — Воспроизводимая загрузка/review relocation dataset

Зависимости: TB-D02.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: fixed versioned JSON package для nested tax data, documented dry-run/apply
  workflow, validation всех записей и атомарность/idempotency. Основной runtime уже читает
  Postgres; не hardcode новые настоящие цифры в Vue и не вводить universal mapper.
- MVP путь допустим как проверяемая операторская CLI-процедура инженера; не требует
  полного Admin redesign. UI редактор relocation позже через отдельный design gate.
- Проверки: no-write dry-run, duplicate/country-city keys, unchanged/changed/stale, review
  references/датировки, повторный apply, rollback transaction и изолированная target DB.
- Готово: dataset можно подготовить/проверить/обновить без ручного опасного SQL;
  parser validation и approval предметных налоговых допущений — разные проверки.

### TB-D04 — Настоящие источники и человеческий review

Зависимости: TB-D01.
Режим: GATE. Сложность: L. Приоритет: P0.

- Условие: владелец выбрал покрытие и ответственного за предметные данные/допущения.
- Работы: собрать проверяемые источники жилья/расходов/трансфера и официальные налоговые
  источники; зафиксировать дату/границы выборки/пропуски. Несопоставимое не смешивать.
- Готово: подготовленный reviewed пакет с автором/датой/ограничениями. LLM не присваивает
  себе юридическую/налоговую квалификацию и не подтверждает чужое approval.
- Если review нет: оставить DEMO/unsupported, а не публиковать фиктивный VERIFIED ради K2.

### TB-D05 — Понятный результат переезда в Candidate flow

Зависимости: TB-D02, TB-E01.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: job context/входы/расходы/остаток, initial budget, source/date/assumptions,
  changed destination и возврат к вакансии. Preserve existing handoff/state ownership.
- Модули: RelocationPreview, vacancy context/composables, error/empty states.
- Проверки: unsupported/hours/currency/stale/no data/error/negative outcome, source links,
  browser back/reload, narrow/wide; ноль «подставленных» размеров зарплаты в чужой валюте.
- Готово: человек понимает значение результата и может вернуться к Apply, а не остаётся
  с красивой цифрой без единиц/периода/происхождения.

### TB-D06 — Approved dataset в preview и поддержка обновлений

Зависимости: TB-D03, TB-D04, TB-D05, TB-H02, TB-G05.
Режим: GATE. Сложность: M. Приоритет: P0.

- Работы: одобренный import/review в точный preview, сверка контрольных расчётов,
  provenance/UI и определённый процесс повторного review/stale handling.
- Проверки: SQL → API → UI с reference cases, reviewed vs demo fallback, invalid data
  исключены, backup/rollback обновления; production не затрагивается.
- Готово: основную продуктовую ценность можно показать на настоящих согласованных данных;
  не обещана постоянная актуальность без назначенного процесса/человека.

## E. Дизайн и цельный пользовательский путь

### TB-E01 — Эскиз новых workflow и acceptance map

Зависимости: TB-B01, TB-D01.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: Candidate v1 остаётся baseline; отдельно показать preflight/snapshot, handling
  detail, ручную передачу и failure/withdrawal. Reuse Nuxt UI/Lucide/Core/Candidate tokens.
- Выход: короткий flow + state matrix + narrow/wide prototype. Figma при наличии write
  access; при read-only — локальный интерактивный prototype/screenshots и список deviations.
- Готово: ясны все действия/переходы/состояния; новый Figma freeze/owner approval не выдуман.
  Для полного admin redesign эта задача разрешения не создаёт.

### TB-E02 — Новый кандидат без тупиков

Зависимости: TB-B03, TB-C02, TB-D05.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: путь из Guest detail через login/profile/contact обратно к исходной вакансии
  и незавершённому Apply; корректная session expiration, duplicate и недоступная вакансия.
- Проверки: web/Telegram-only/null email, отмена входа/ошибка save/retry/back, сохранённые
  несекретные drafts без межаккаунтной утечки, доступный focus на ошибке.
- Готово: новичок понимает зачем вход и что осталось сделать; login не теряет намерение.

### TB-E03 — Визуальный и accessibility проход

Зависимости: TB-B05, TB-B07, TB-C03, TB-D05.
Режим: AUTO. Сложность: M. Приоритет: P1.

- Работы: icon alignment/selected states, размеры/hit targets, длинные строки, density,
  empty/error/loading, contrast, dialogs/focus/keyboard/reduced motion. Компонентные правки
  в shared primitive, не 12 разных локальных заплаток.
- Проверки: screenshots 320/390/768/900/1024/1440; light/dark, zoom/keyboard, отсутствие
  horizontal overflow/hydration warnings/перекрытий; реальные click states, не только PNG.
- Готово: видимые дефекты записаны и исправлены/обоснованы, owner acceptance остаётся отдельно.

### TB-E04 — Telegram и browser host edge cases

Зависимости: TB-B07, TB-D05.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: проверить существующий adapter, browser fallback, repeated launch, deep links,
  theme/back/settings/safe areas, slow/expired initData. По docs Telegram сверить APIs,
  никаких initDataUnsafe или отдельного дерева страниц.
- Проверки: automated host simulation с API/session; пустой/старый/тамперенный launch,
  popup cancel, независимые cookie stores, optional feature unavailable.
- Готово: simulation coverage полный и честно так назван; настоящий клиент ещё H03.

### TB-E05 — Повторяемый product walkthrough

Зависимости: TB-B09, TB-E02, TB-E03, TB-E04.
Режим: AUTO. Сложность: S. Приоритет: P1.

- Работы: актуализировать chooser/synthetic cases и 5–10 минутный сценарий просмотра:
  Guest → candidate → relocation → Apply → operator handling → candidate outcome.
- Выход: dev:review, перечисленные routes/personas/действия, screenshot evidence и known gaps.
- Готово: владелец/независимый reviewer видит целую услугу без реальных ключей и не должен
  угадывать скрытые admin URLs или считать no-login guest preview всем продуктом.

## F. Operations, dashboard, поддержка

### TB-F01 — Определения операционных метрик

Зависимости: TB-B01, TB-C01.
Режим: AUTO. Сложность: S. Приоритет: P1.

- Работы: accounts ≠ complete profiles; public jobs = visibility predicate; applications
  = реальные записи; received/in-work/contact-recorded/presented/closed = handling facts.
  Backlog age/время до первого действия определяются по timestamps, не guessed SLA.
- Выход: metric dictionary с numerator/denominator/timezone/источником/исключениями.
- Готово: current status не называется историческим funnel; visits/conversion/hire/delivery
  charts отсутствуют, пока нет соответствующих событий/смысла/разрешения на сбор.

### TB-F02 — Полезный operator dashboard

Зависимости: TB-F01, TB-B04, TB-C03.
Режим: AUTO. Сложность: M. Приоритет: P1.

- Работы: расширить existing DB aggregates новыми work queues/oldest unhandled и links;
  bounded period/filter, согласованная read snapshot и нужные indexes. Без новой BI системы.
- Проверки: fixture aggregates совпадают с SQL, history не считает duplicates, revoked
  role, zero data/error/retry, переход по счётчику открывает тот же набор.
- Готово: dashboard помогает сделать следующее действие и не имитирует рост/найм/доставку.

### TB-F03 — Runbook оператора, данных и обращений

Зависимости: TB-B08, TB-C04, TB-D03.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: кто/как принимает смену и разбирает заявку, ручной company/candidate контакт,
  запись результата/ошибки, no-response/withdrawal, source corrections, privacy/support
  обращения и проверка личности без публикации данных. Роль человека пока placeholder.
- Выход: короткие шаги для неавтора кода и operational checklist; отдельные запросы на
  назначение ответственных/канала, не обещание агентом постоянного дежурства.
- Готово: synthetic оператор проходит по инструкции; для beta обязательно фактическое
  подтверждение ответственного, контакта поддержки и допустимого процесса G05/H04.

### TB-F04 — Наблюдаемость и восстановление

Зависимости: TB-A04, TB-B04, TB-D03.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: добавить bounded event/result telemetry без PII к новому workflow, request ID,
  liveness vs readiness, ошибки импорта/БД. Проверить инструкции incidents, app rollback
  и separate DB restore, backup sensitivity/retention/restore rehearsal.
- Проверки: synthetic dump → другая disposable DB → миграции/инварианты/replica counts
  и representative flow, redaction tests, при сбое БД — честная ошибка, не «ничего нет».
- Готово: воспроизводимый local restore и triage; настоящие preview backups/alerts/люди
  остаются H02/H04, а не придуманная on-call гарантия.

## G. Безопасность, private data и публичные обещания

### TB-G01 — Negative authorization на новых границах

Зависимости: TB-B09, TB-C03, TB-D03.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: API matrix actor/action/resource; guest/candidate/other user/current vs revoked
  ADMIN, session isolation, CSRF/origin, strict body/limits, cache headers.
- Проверки: direct API без client guards, snapshot/event/notes leakage, stale cookie,
  arbitrary IDs, role escalation, legacy/current accounts.
- Готово: нарушения воспроизводимо отвергаются, не спрятаны только UI; отдельный auth
  framework/сложная role hierarchy не добавлены без требования.

### TB-G02 — Snapshot/PII/retention implementation review

Зависимости: TB-B06, TB-B07, TB-F03.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: минимизация полей, candidate/internal projection, logs/errors/artifacts/cache,
  legacy access, исправление и процедура удаления/экспорта по утверждённой политике.
  Не хранить паспорт/CV upload ради полноты и не объявлять withdrawal удалением данных.
- Проверки: allowlists, no-store, account switch, private notes, PII-free telemetry/traces;
  сценарий privacy обращения на synthetic данных, без самовольного стирания истории.
- Готово: ясно что хранится/видно/передаётся и каким техническим процессом исполняется
  утверждённая политика. Сроки и legal basis не выбираются LLM как юридическое заключение.

### TB-G03 — Миграции, concurrency и объём данных

Зависимости: TB-B09, TB-C02, TB-C03, TB-D03, TB-F02.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: прогнать mixed legacy/new upgrade, collision/retry/transaction failure,
  индексы типичных фильтров и ограниченность API на representative synthetic dataset.
- Проверки: parallel Apply/withdraw/share/assign/import/review, atomicity/uniqueness,
  no destructive cascade in новых связях; backward app rollback compatibility boundaries.
- Готово: нет потери/подмены заявки или публикации непроверенного контента; фактический
  замер локального набора не выдаётся за production SLA или нагрузочный сертификат.

### TB-G04 — Abuse и release hardening

Зависимости: TB-A03, TB-B09, TB-F04.
Режим: AUTO. Сложность: M. Приоритет: P0.

- Работы: error leakage/XSS/URL schemes/open redirect/input limits/replay review;
  rate-limit requirements для Apply/auth/import без автоматического снятия существующей
  WAF. Security headers/secret scan и проверка production output без dev chooser.
- Проверки: route/library regressions, malicious plain-text/source links, abusive repeated
  input на изолированном окружении, lockfile audit в точной release revision.
- Готово: blocker findings устранены, конфигурация реальной WAF/лимитов вынесена в H02/H03;
  интеграционные тесты не отключены для зелёного CI.

### TB-G05 — Одобрение содержимого и operational policy

Зависимости: TB-C01, TB-D01, TB-B01, TB-F03.
Режим: GATE. Сложность: M. Приоритет: P0.

- Условие: владелец/уполномоченный специалист утверждает разрешённые источники,
  candidate disclosure/Privacy/Terms, minimum sharing/retention/request handling и support.
- Работы: подготовить список фактической обработки/ограничений, вопросов и текстовых
  placeholders; технически встроить только предоставленные/одобренные versioned тексты.
- Готово: evidence «кто/что/когда утвердил», pending/noindex снят только с approved версии;
  нет ICO/доходности/custody/гарантий и неподписанных чужим именем legal документов.

## R. Независимое ревью после K1

### TB-R01 — Независимый аудит exact revision

Зависимости: TB-A02, TB-A03, TB-A05, TB-E05, TB-F02, TB-F03, TB-F04, TB-G01, TB-G02, TB-G03, TB-G04.
Режим: REVIEW. Сложность: L. Приоритет: P0.

- Условие: владелец выбирает/запускает отдельную reviewer-модель/сессию; исполнитель
  передаёт baseline/final SHA, исходный scope, diff/tests/evidence/known blockers.
- Работы reviewer: самостоятельно читать diff/код, атаковать state/auth/PII/concurrency
  assumptions, пройти browser/API/SQL путь и восстановление, сверить UI/ценность.
- Готово: конкретные findings с severity/path/repro, test gaps и verdict. Не просто
  пересказ отчёта исполнителя. Нет заявления, что модель сертифицировала legal/compliance.

### TB-R02 — Исправить findings без разрастания scope

Зависимости: TB-R01.
Режим: AUTO. Сложность: L. Приоритет: P0.

- Работы: каждому подтверждённому дефекту regression, узкий fix и повтор relevant
  проверок. P0/P1 блокируют дальнейший release; P2 — impact и явный список решения.
- Готово: findings связаны с commits/tests, отсутствие воспроизведения обосновано;
  недостаток времени/лимитов не переименовывает finding в fixed.

### TB-R03 — Повторная независимая приёмка release candidate

Зависимости: TB-R02.
Режим: REVIEW. Сложность: M. Приоритет: P0.

- Работы: reviewer проверяет исправленные места и regression risks на final SHA;
  полный CI/runtime walkthrough, остаточные ограничения и release go/no-go checklist.
- Готово: независимый code verdict и exact release candidate. Если данных/провайдеров
  ещё нет, результат только code-ready, а не native/hosted/beta acceptance.

## H. Настоящий preview и beta

### TB-H01 — Разрешённый hosting/DB/provider target

Зависимости: TB-A04.
Режим: GATE. Сложность: M. Приоритет: P0.

- Условие: подтверждены владелец проекта, допустимый план/бюджет, stable preview origin,
  isolated Neon target и права конкретных операций. Предложение не включает оплату.
- Работы: read-only refresh cloud/domain; согласовать один CD механизм, доступы/secret
  stores, CI/review gates, callback/bot ownership. Никакого CLI обхода plan restrictions.
- Готово: заполнен environment passport с dated IDs, owners/approvals и rollback;
  metadata access не названо SQL readiness, secret values нигде не раскрыты.

### TB-H02 — Поднять controlled preview проверенной ревизии

Зависимости: TB-H01, TB-R03.
Режим: GATE. Сложность: L. Приоритет: P0.

- Условие: точные preview DB restore/provision/migration/deploy разрешены, rollback готов.
- Работы: backup/snapshot/restore rehearsal, readonly schema check → reviewed migrations,
  environment-specific credentials, deploy без production/domain traffic assignment;
  current runtime/health/SSR/logging/security/DB access подтверждены.
- Проверки: protected preview доступ через разрешённый способ, current-role API denial,
  raw error/PII redaction, реальный backup restore в isolated target.
- Готово: живой preview exact SHA с работающей БД, без credentials в PR CI/build artifacts.

### TB-H03 — Настоящий OAuth и native Telegram

Зависимости: TB-H02.
Режим: GATE. Сложность: M. Приоритет: P0.

- Условие: console callbacks/bot menu и human login/2FA разрешены/доступны.
- Работы: Google/GitHub login/link/conflict/sign-out и Telegram launch с реальным
  initData; iOS/Android/desktop где доступны, browser fallback, theme/back/safe areas.
- Готово: device/provider/version/date evidence с PASS/FAIL/BLOCKED. Если устройства
  нет, соответствующий пункт не «PASS по simulation»; owner принимает остаточное покрытие.
- Найденные дефекты исправить с regression и адресным повторным review, не «обойти» защиту.

### TB-H04 — Человеческий pilot walkthrough и operational handoff

Зависимости: TB-H03, TB-C05, TB-D06, TB-G05.
Режим: GATE. Сложность: M. Приоритет: P0.

- Условие: назначены реальный оператор/поддержка, reviewer продукта, permitted contacts/data;
  кандидат/компания участвуют только с разрешением, агент сам их не привлекает.
- Работы: человек проходит candidate и operator путь, source/data объяснимость, contact/
  follow-up процедуру и сбои. Можно использовать согласованную synthetic заявку на approved
  real vacancy, не выдавая её за реального кандидата/найм.
- Готово: docs15 acceptance record на exact SHA, подтверждена ценность/понятность,
  исправлены blockers, отдельное решение о допустимости beta, не просто красивый screenshot.

### TB-H05 — Production go/no-go и контролируемая beta

Зависимости: TB-H04.
Режим: GATE. Сложность: L. Приоритет: P0.

- Условие: явное разрешение на конкретный main/release/deploy/domain/shared DB change;
  reviewed migrations, backups/retention, secrets/callbacks, rollout и rollback targets.
- Работы: интеграция approved candidate без повторного применения cumulative PR,
  exact production deployment, public/auth/operator smoke, native TG menu, logs/метрики.
- Готово: code/test/merge/deploy/live evidence раздельны; первые заявки доступны оператору,
  ошибки наблюдаемы, owner знает остановку/откат. Нет автоматической гарантии найма,
  on-call 24/7, денег/ICO или нового full-time обязательства CTO.

## X. После beta: только отдельным принятым scope

| ID | Направление | Условие нового старта |
| --- | --- | --- |
| TB-X01 | Server Saved, миграция local shortlist | Доказана потребность в account sync; merge/privacy/conflict contract |
| TB-X02 | Bot/email delivery, reminders | Согласованы provider/budget, opt-in, события/retries/idempotency/delivery semantics |
| TB-X03 | Полный Admin/CRM и employer self-service | Отдельный discovery/design gate, роли/тенантность, реальные operator pain points |
| TB-X04 | API connectors/парсеры/XLSX и import history | Approved source/terms/scale; обоснованы durable jobs, mapper и приоритет источников |
| TB-X05 | Дополнительные города/языки/сценарии переезда | Reviewed data/process и полноценные i18n тексты, не фиктивный language toggle |
| TB-X06 | Новая инфраструктура/analytics/AI | Метрики/нагрузка/качество оправдывают сложность и расходы, отдельный ADR |

Web3/ICO/payment/custody/KYC, гарантирование найма/контрактов и юридическая аттестация
не являются ни одной из задач этого autonomous backlog.
