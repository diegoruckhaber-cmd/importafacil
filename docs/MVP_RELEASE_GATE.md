# MVP release gate

The first user test is gated on the combined Santa Catarina + federal import scope.

Required before release:

1. SC multi-item calculation works with item-level benefit decisions.
2. Import expenses can be allocated by their own criteria without conflating allocation with tax-base treatment.
3. Federal II, IPI, PIS-Importação and Cofins-Importação have a documented calculation path.
4. 2026 PIS/Cofins changes are represented and tested.
5. Special federal regimes remain conditional until their legal basis and eligibility are supplied.
6. The application shows an explicit warning whenever a fiscal result cannot be determined safely from the available inputs.
7. Other states remain outside this release.
