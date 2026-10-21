# Mechanical test log

## Observed via screenshots
- Without simulated human review: an error is shown and SMS preview blocked.
- With simulated human review: demo review state and unsent SMS appear.
- Restoration remains explicitly unconfirmed.

## Pending
- Editing the source invalidates the previous review.
- Simulated readings display fresh, stale and missing-data cases.
- Fictional points match A, B and C.
- Outside point returns no coverage.
- ML implementation and evaluation.
- Financial calculations.
- An actual observed application bug, fix, retest and redeployment.

These observations are local checks, not real pilot outcomes.

## Geodata browser check reported by user
- Outside point displays no zone assigned.
- Message explicitly preserves access to basic notices.
- Result: passed for this selected case.

## ML checks pending
- Model initializes and displays held-out evaluation counts.
- Analysis responds to missing source.
- Editing form invalidates previous ML result.
- ML does not change incident approval or SMS state.

## ML screenshot observation
- Model initialized and returned an advisory score.
- Held-out set: 120 synthetic cases.
- TP 100, TN 11, FP 9, FN 0.
- Precision 91.7%; recall 100% on this synthetic set only.
- Missing-source and edit-invalidation checks remain pending.

## Money checks pending
- Zero denominators remain inconclusive.
- Negative costs and numerator above denominator are rejected.
- Costs and 70/30 components calculate correctly.
- Synthetic thresholds never establish real payment eligibility.

## Money zero-denominator test
Observed in screenshot:
- All three 0/0 quality metrics display inconclusive.
- Actual payment eligibility remains unproven.
Result: passed for zero denominators.

## Issue MONEY-001
With all costs at zero, the interface displays a required 10:1
benefit of MXN 0. Although labeled unproven, this is misleading
for financial evaluation.
Expected: zero-cost base cannot support a meaningful 10:1 evaluation.
Status: observed; fix and retest pending after deployment 1.

## MONEY-001 fix and local retest
- Before: zero costs displayed a misleading MXN 0 benefit threshold.
- Fix: zero costs now display "10:1 not calculable with zero costs."
- Zero-cost retest: passed, observed in screenshot.
- Positive-cost regression check: MXN 15,000 requires MXN 150,000.
- Benefit remains explicitly unproven.
- Deployment 2 and live verification pending.

## Navigation and revised SMS preview
- User clicked the SMS navigation link and supplied its destination screenshot.
- Result: link reaches the SMS preview section.
- After simulated human review, the revised SMS sample was visible.
- Sample explicitly distinguishes information updates from restoration.

## Additional mechanical checks
- Source-edit invalidation: user confirmed that editing the source
  withdraws the SMS preview and unchecks simulated human review.
  Result: passed.
- Invalid comprehension count: entered 2 understood / 1 sampled.
  Screenshot shows numerator-above-denominator rejection.
  Result: passed.
