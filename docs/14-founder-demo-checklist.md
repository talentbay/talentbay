# Founder checklist: one fictional application

**Internal, 5-10 minutes.** With Node 22, locked dependencies and PostgreSQL 18 installed, run `pnpm dev:review`. Open the [local role chooser](http://127.0.0.1:3131); it opens the [app](http://127.0.0.1:3130/jobs). Keep the command running. This run uses a disposable local database and fictional identities. Do not tunnel the chooser, promote a real admin, use Neon, or send anything to an employer.

1. **Find a role.** Choose **New candidate / First application**. Open London's **Senior Backend Engineer** and save it. Open **Relocation estimate**, select **High**, and compare the monthly remainder. Identify which figures are illustrative. **Close** should return to the same vacancy.
2. **Apply.** Select **Apply**, then **Review your profile**. Enter a fictional phone number and select **Save profile**. Read the data to be shared and the named company. Can you submit without agreeing to share for this particular role? You should not be able to. Acknowledge and submit once.
3. **Check the receipt.** Expect **Application received by TalentBay**. Open **View application**, reload, then close the detail dialog: **Your applications** should list the role once. Who has the application now? TalentBay, not the employer.
4. **Handle it.** Choose **Content operator / Application handling** and review that application. **Take application**, then **Record action** to start handling. Select **Record company contact**, enter a fictional private reference and record the action. Under **Record completed handoff**, **Prepare candidate package** must not add a journal entry. Only confirm and record a *simulated* handoff; send nothing.
5. **Check what the candidate sees.** Choose **New candidate / Applications** and select **View** on the role. Expect **TalentBay recorded a manual handoff**, without the operator's private reference or a claim that the employer read or received it.

**Record:** Git revision, PASS/FAIL, and the first mismatch (step, expected, observed). Do not record identities or profile contents. Stop immediately if a target is not local, data is real, or private notes become visible. End with Ctrl+C.

One reviewer can switch both roles for rehearsal. For formal human operator acceptance, a non-author must do the [operator exercise](31-operator-runbook.md). The [native test-bot check](21-local-product-review.md) is separate; the local chooser proves neither real Telegram sign-in nor [readiness for a public pilot](20-release-readiness.md).
