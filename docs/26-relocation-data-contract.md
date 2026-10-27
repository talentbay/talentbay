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
an approved addition to the11-city pilot). D03 imports and D05 UI coverage are next; the
new schema/example do not themselves populate any DB or expand public real-data coverage.

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

`GET /api/v1/relocation/preview` now requires explicit `location` and `annualGross`.
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
public reviewed data. Current SQL validation alone does not add the full new package's
assumptions/validUntil to legacy rows; persisting that metadata/review workflow belongs
to D03 before a source-backed rollout. No blanket automatic stale policy is claimed.
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

Next D03: bounded engineer-operated dry-run/apply, whole-file validation, source/assumption
metadata, idempotency/revisions/atomicity and isolated-target safety; no general admin
redesign. D05: source/date/assumption/unsupported/error outcome UX. No real dataset, shared
migration, provider call, booking, tax filing or production change was performed here.
