# London: numbers to check before a pilot

**Engineering evidence, 20 November 2026. Not an import file or a reviewed city.**
The figures below are worked examples in GBP, not a take-home quote for a candidate.
No real profile, offer or immigration application is involved. London stays DEMO.

## Earnings: what the current engine can and cannot reproduce

Assume one employee in England for the full UK tax year 6 April 2026 to 5 April 2027.
Salary is the only income, with entitlement to the standard allowance and no pension
adjustments, benefits, other allowances, student loan or other deductions. Only under
these assumptions do we take gross salary as [adjusted net income](https://www.gov.uk/guidance/adjusted-net-income).
The [HMRC tables](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027)
supply the bands; [section 35(2)-(3)](https://www.legislation.gov.uk/ukpga/2007/3/section/35)
gives the taper and rounding. These are annual Income Tax references, not monthly PAYE.

| Annual gross | Remaining personal allowance | Annual Income Tax |
| ---: | ---: | ---: |
| 60,000 | 12,570 | 11,432.00 |
| 100,000 | 12,570 | 27,432.00 |
| 100,001 | 12,570 | 27,432.40 |
| 110,000 | 7,570 | 33,432.00 |
| 125,140 | 0 | 42,516.00 |
| 150,000 | 0 | 53,703.00 |

Example: at 60,000, taxable salary is 47,430. Income Tax is
`37,700 x 20% + 9,730 x 40% = 11,432`. Above 100,000, the remaining allowance is
rounded **up** to a whole pound. At 100,001 the unrounded allowance is 12,569.50,
so it remains 12,570. Simply inserting a 60% marginal band in TalentBay's continuous
progressive model gives 27,432.60 instead of 27,432.40. The 60% is the mathematical
effect of a taper, not a published tax rate. **Do not import the comparison bands as
an exact tax model.** Run the offline comparison:
`pnpm exec vitest run tests/relocation/london-review-reference.test.ts`.

**Separate National Insurance check.** For the 60,000 example only, assume twelve
identical monthly payments of 5,000 to an ordinary category A employee (not a director).
Using HMRC's monthly primary threshold and upper earnings limit, employee Class 1
contributions in this scenario are `(4,189 - 1,048) x 8% + (5,000 - 4,189) x 2% =
267.50` per month, or 3,210 across those twelve periods. That changes the annual
income after these two deductions from 48,568 to 45,358, *before* rent or living costs.
It is not employer NI, and dividing an annual calculation into twelve cannot model
irregular pay or reproduce individual payslips. Current data model has no separate
pay-period NI calculation.

## Moving: cash needed is not always an expense

The [Home Office worked example](https://www.gov.uk/skilled-worker-visa/how-much-it-costs)
describes a two-year Skilled Worker application from Argentina, outside the immigration
salary list. It gives an application fee of 819 and an immigration health surcharge
of 2,070 for the two years: **2,889 upfront**, not an annual or monthly health cost.
The separate 1,270 maintenance amount in that example is money to demonstrate, not
a fee to add to 2,889. See [surcharge scope and partial years](https://www.gov.uk/healthcare-immigration-application/how-much-pay).
This example does not select Argentina as TalentBay's departure point, establish visa
eligibility, establish employer reimbursement or provide a flight quote.

## What the reviewer still needs

- **Tax:** decide the deductions and supported pay pattern; check the taper, rounding
  and income boundaries against an independent reference before approving any model.
- **Housing and living:** the [ONS rent selection and its coverage](../26-relocation-data-contract.md#london-first-evidence-packet-not-a-reviewed-estimate-20-november-2026)
  are documented. Confirm housing basis and supply utilities, groceries, transport,
  healthcare and other monthly assumptions; an unknown cost is not zero.
- **Move:** specify a departure city/date, who pays which fees, and evidence for the
  airfare, deposit, temporary housing and other upfront costs. Don't count the same
  charge in monthly and one-time totals.
- **Release:** record reviewer, approval reference and validity period only after the
  whole package is checked. No PILOT/VERIFIED JSON, publication or shared DB write
  follows from these examples.

Sources accessed 20 November 2026. Contains public sector information licensed under
the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
