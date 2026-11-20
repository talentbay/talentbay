# Relocation Data Contract v1

Checked: 2026-10-27. TB-D01/D02 engineering contract, not actual tax/cost approval.
One responsive application, existing calculation/list APIs and PostgreSQL remain.
Validation uses the installed Zod4.6 API, not another schema/financial framework.
[Official schema API](https://zod.dev/api) checked before implementation.

## Coverage and Missing Data

The owner-confirmed pilot set is exactly11: Dubai, London, Berlin, Lisbon, Tallinn,
Belgrade, Istanbul, Tbilisi, Bangkok, Buenos Aires, Mexico City. Canonical keys/country/
currency live in `shared/relocation/geography.ts`. This is a coverage decision, not evidence
that any city's costs or tax assumptions have been reviewed. Do not invent numbers for
the missing cities or replace11 with a smaller list silently.

`relocationDatasetCoverage` reports every pilot city as MISSING/DRAFT/VERIFIED/STALE for
an explicit UTC day. No record means MISSING, never zero rent/tax/move cost. The shipped
example has one fictional DRAFT London record and10 missing cities. Existing runtime
still has four labelled illustrative demo cities, including historical Amsterdam (not
an approved addition to the11-city pilot). D03 has local bounded imports; D05 exposes
all11 destinations with REVIEWED/DEMO/UNAVAILABLE availability and no invented prices. The
new schema/example do not themselves populate any DB or expand public real-data coverage.

D05 adds compatible `destinations` to the locations response (`items`/`total` are retained).
Scenario keys are canonical and stable; `calculationKey` points to the current reviewed
row ID or demo, or is null. Public calculation details now expose the actual cost groups,
annual modeled deduction, assumptions and review validity, never the private reviewer/
approval reference/import actor. The client displays server calculations, not a second
tax implementation. See [candidate workflow](27-relocation-candidate-workflow.md).

## Fixed Package

`server/services/relocation/dataset-contract.ts` validates version1 JSON and the executable
synthetic example at `docs/examples/relocation-synthetic.v1.json`. Purpose is SYNTHETIC or
PILOT; synthetic records cannot be VERIFIED. Parsing a PILOT file is not proof of approval
and does not authorize its ingestion or publication. All fields are strict/bounded;
duplicates, unknown destinations, currency mismatches or guessed extra fields are refused.

- One adult, salaried employee; explicit tax residency/year, included/excluded deductions,
  housing basis, move origin/route and exclusions. No family/contractor/citizenship inference.
- All cost amounts use the destination's **major currency units**; living is per MONTH,
  income per YEAR and move costs ONCE. Rates are integer BASIS_POINTS (10000 =100%).
  No FX, hourly-hours assumption, live rental listing or bookable airfare is implied.
- Monthly: rent, utilities, groceries, transport, healthcare, other. Move: flight, visa,
  deposit, temporaryHousing, other. A real zero must be evidenced; unknown is not zero.
  An incomplete city's record stays absent/MISSING until a complete package can be prepared.
- Sources have a label, safe HTTP(S) URL, accessed UTC day and TAX/RENT/LIVING/MOVE coverage.
  Verified packages require all four evidence groups, effective day, reviewer reference,
  dated review, approval reference and an explicit validUntil day. These are references to
  human evidence, not a machine-generated legal certificate or credential.
- Effective/source/review/validity dates must agree. Coverage rejects a future review or
  expires at the explicit validUntil boundary; there is no invented universal N-day policy.
  The date boundary is inclusive, in UTC. The package is a snapshot, not live quotes.

## Calculation Boundary

`data-contract.ts` validates the current SQL calculation input independently of a status
string. Costs must be complete, finite/nonnegative and <=100000000 per category (technical
sanity ceiling, not a statement about market prices). Progressive models have1..32 strictly
increasing finite positive thresholds and exactly one final null/infinity bracket. Rates
are integer0..10000, allowance nonnegative. Thresholds apply to income **after** allowance.
The engine supports this simple marginal model or one evidenced effective rate; it does
not model every jurisdiction's credits, caps, filing status, social charges or deductions.

Annual tax is applied before monthly division. Other monthly costs sum separately from
rent. Disposable = (annual gross - annual tax)/12 - rent - other monthly costs. Move costs
sum independently and are not silently deducted as monthly expenses. Internal arithmetic
keeps fractions; presentation rounds final totals to whole units, not a payment ledger.
Negative disposable is valid and visible. Reference cases cover0, allowance, bracket
edges, high income, fraction/rounding and negative results.

The existing nominal API ceiling remains2000000 annual units, including0. This is a software
limit, **not comparable purchasing power across currencies**, and may exclude useful ARS/
other high-nominal salaries. Review the approved pilot/reference cases before changing it;
never truncate, rescale or convert those salaries silently. Inputs outside the bound are
rejected, not calculated as a smaller salary. All calculations remain estimates, not advice.

The candidate UI uses `POST /api/v1/relocation/preview` with a same-origin, uncompressed
JSON body and no query string. The handler checks 1 KiB on streamed/supplied bytes or
declared length. If a host supplies only a parsed object and no length, only its JSON
representation can be bounded here, not the original HTTP message. The anonymous calculation has no side
effects. The compatible GET and the new POST require explicit `location` and `annualGross`.
This deliberately removes the historical hidden London/110000 defaults. Decimal query
strings allow at most2 fraction digits; blank, null, arrays, booleans, exponent/hex and
nonfinite values are not money. Zero is accepted explicitly. Standalone UI starts with no
salary; vacancy context can supply a same-currency YEAR or MONTH midpoint (MONTH x12).
HOUR or currency mismatch has no invented annual salary/FX and needs explicit user input.

Current SQL VERIFIED rows must pass the numeric/source/date contract, have a non-null
review not in the future and no later-than-review source date. Invalid/unreviewed/future
rows are excluded from destinations and explicit IDs return unsupported, never VERIFIED
or a500 caused by malformed JSON. Legacy city links may use an explicitly labelled demo
fallback; location-ID requests never silently resolve to another city. DRAFT/STALE are not
public reviewed data. D03 additionally requires a matching reviewed PILOT package snapshot
with current explicit validUntil, not just legacy sources/review columns. Legacy rows are
not backfilled or automatically approved. No blanket automatic stale policy is claimed.
Currency must also be supported by Node22's Intl currency catalogue, not merely three
letters; this is a runtime compatibility boundary, not an exchange-rate service.
[ECMA-402 currency discovery](https://tc39.es/ecma402/#sec-intl.supportedvaluesof) checked27.10.

## Evidence and Review Checklist

The subject-matter owner prepares evidence; an engineer validates package/schema/math;
a designated reviewer confirms tax residence/year/coverage and cost sampling/limitations.
The founder/owner approves the exact pilot target and dataset reference. A developer or
LLM cannot substitute itself for a tax/legal reviewer or invent their signature.

For every city record, collect official tax rules for the stated period/residency/income
basis, deductions included/excluded, housing sample/unit/area/date (not a single live offer),
expense scope, transfer origin/dates and one-time assumptions. Record access dates, rights
and gaps, then compare hand-worked boundary cases before a dated review/validUntil.
The founder historically reported a legal partner; current availability/qualifications/
specific approval have not been independently verified. These remain D04/D06 gates.

### London: first evidence packet, not a reviewed estimate (20 November 2026)

The public locations response showed London, Berlin and Lisbon as DEMO, the other eight
pilot destinations as UNAVAILABLE, and zero as REVIEWED. Amsterdam was also DEMO but
is outside the eleven. This says nothing about private drafts.

| Component | Reproducible input | Decision still needed |
| --- | --- | --- |
| Rent | [ONS monthly rent workbook](https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics), 18 November edition, Table 1. Filter area code `E12000007` (London); select the one-bedroom **rental price**, GBP/month, not the index, growth rate or all-property average. Machine-read 142 distinct monthly observations through October 2026. | Approve the one-bedroom regional mean as the pilot housing assumption. It covers existing and new tenancies, not an asking-price quote. Credit ONS and check edition-specific exceptions under its [reuse terms](https://www.ons.gov.uk/help/terms-conditions). |
| Earnings deductions | [HMRC payroll tables](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027) separate England PAYE, employee NI and employer NI. | Specify residency, tax year, pay period and included deductions. Verify that the model can represent them before accepting a result. |
| Local travel | [TfL fare lookup](https://tfl.gov.uk/how-to-pay/check-travel-costs) supports a route or zonal fare reference. | Specify route, mode and commuting frequency. A cap is not a monthly bill; bulk reuse rights have not been established. |

The [London worked review sheet](examples/london-2026-27-review.md) adds independent
annual tax reference amounts, a counterexample to the continuous taper, a separate
regular-pay employee NI calculation, two monthly budget items, a refundable deposit
cap and a sourced two-year immigration fee example. The region-wide rent is not
specific to the chosen travel zones. Neither subtotal nor deposit is a cost-of-living total.
It is evidence for a reviewer, not a city package, a confirmed itinerary or a release.

Still missing: evidence for other recurring costs and the one-time move (departure city,
itinerary, actual tenancy terms, temporary housing and fees), a reviewer and a validity period. Keep
London DEMO. No data was ingested and no employer, source or reviewer was contacted.

## Local Engineer Import (D03)

`pnpm db:relocation` reuses the same TypeScript schema/services, not a second JSON/SQL
implementation. TSX4.22.4 is now an explicit dev-only dependency; it was already in the
locked transitive graph. Added offline with no downloaded packages; frozen install and
real CLI help/validation/preview/apply/replay are tested. This does not change the Node
server runtime. [TSX custom config and separate typecheck](https://tsx.hirok.io/typescript)
checked27.10: operations inherits generated Nuxt aliases/types, and `pnpm typecheck`
also checks the CLI separately. No hardcoded pnpm-store paths or fake global types.

```bash
pnpm db:relocation --file docs/examples/relocation-synthetic.v1.json --validate-only
# In an explicitly configured disposable local DB, with an existing synthetic ADMIN:
pnpm db:relocation --file path/to/package.json --actor-id 42
# Use the exact revision from the no-write preview:
pnpm db:relocation --file path/to/package.json --actor-id 42 --apply --revision <revision>
```

`--validate-only` needs no DB or credentials. Database mode defaults to no-write preview.
The initial executable **refuses every cloud/shared target** via the existing disposable
guard: explicit CI/disposable markers, matching loopback runtime/migration URLs and exact
talentbay_ci database/role. It does not load `.env`, promote an account or infer isolation
from a branch name. The engineer's DB credentials are privileged; actor-id records the
claimed existing local operator and verifies its current ADMIN role, not an OAuth login
or proof of the identity of a person running a shell. There is no new public HTTP endpoint.

Files are regular/non-symlink bounded1MiB UTF-8 JSON; options, records and all fields are
strict. Errors expose bounded field paths/codes, not raw values, SQL, connection errors,
credentials or file contents. Preview returns counts, IDs/operations and all11 coverage
states, not private tax/reviewer payload. It validates the whole file before SQL, checks
current operator and reads one repeatable-read read-only snapshot. Exact canonical city/
country keys are used; conflicting case/outer-space legacy variants require deliberate
reconciliation, not silent duplicate cities or deletions.

Apply verifies the preview revision/current role in a transaction with a bounded lock/
statement timeout and serialized import lock. Status/publication impact is visible in the
preview. It keeps row IDs/private notes; there is no replace-all/delete-absent behavior.
Any failed write rolls back the whole package. Changed approved content needs a new review
reference or later review instant (not just an equivalent timezone spelling or validity
extension); unknown inputs cannot keep the old review active. Replayed identical data
returns UNCHANGED without resetting review/import/update timestamps, even after a lost
committed response. Snapshot expiry is evaluated at read time using explicit validity,
not a timer required to hide expired data.

Additive0006 stores the full version/purpose/record snapshot, committed importedAt and
operator FK (SET NULL on deletion). The public repository validates the stored package,
current validity and equality with calculation columns. DRAFT/SYNTHETIC/STALE, absent
legacy metadata or numeric drift cannot be advertised as VERIFIED. This detects drift
from the snapshot, **not malicious superuser rewrites of both snapshot and columns**;
DB access controls/backup/real subject-matter approval remain independent gates. Snapshot
reviewer/reference/import actor are not exposed in the current public DTO. D05 adds only
the appropriate public assumptions/source/validity outcome, not private operator identity.

Local legacy migration test retained ID/status/notes and left all new fields NULL; no
historical approval is reconstructed. A complete synthetic CLI preview/apply/replay used
separate processes and kept the same ID; fixtures were removed afterward. SQL tests include
revoked role, concurrent apply, stale preview, changed approval, invalid data, raw drift,
expiry and an actual PG trigger failure on city2 proving city1 rollback.

## Shared Preview Gate / Rollback

The importer service is DB-agnostic, but cloud CLI execution is intentionally not enabled
without a verified environment passport. Before D06, resolve the exact Neon project/branch/
endpoint, prove non-production isolation/access/current schema, backup/restore and owner
approval, then implement/test the narrowly bound target adapter against that observed
provider metadata. Do not relax the loopback guard or point the script at a cloud URL to
pretend this gate passed. No archive restore, shared migration or real dataset was done.

Apply0006 only after that target/backup/migration approval, before selecting the new fields.
Old app builds tolerate additive columns, but their data-reading policy can be less strict;
any rollback must preserve protection/maintenance and reassess public visibility before
reopening. Retain metadata/columns; do not delete them as a down-migration. D05 outcome UX,
real D04/D06 evidence/reviewer/preview acceptance and independent R are still required.
