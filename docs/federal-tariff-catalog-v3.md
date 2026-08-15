# Federal tariff resolver behavior

The resolver must return `automatic: false` whenever the requested NCM is absent, multiple active treatments have equal precedence, or a quota requires authorization that has not been confirmed.

It must never substitute `0` for an unknown II rate.
