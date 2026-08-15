import { resolveMercosulEuIi } from '../lib/mercosul-eu-ii-resolution.ts';

const r = resolveMercosulEuIi({
  date: '2026-08-15', originCountryCode: 'DE', ncm: '3208.10.20',
  baseOfferRate: 9.1, appliedNmfRate: 10, reductionPercent: 20,
  agreementEligible: true, proofOfOriginAvailable: true,
});

if (r.payableRate !== 7.2) throw new Error(`expected 7.2, got ${r.payableRate}`);
if (r.selectedBaseRate !== 9.1) throw new Error('base rate selection failed');

const noOrigin = resolveMercosulEuIi({ ...({
  date: '2026-08-15', originCountryCode: 'CN', ncm: '3208.10.20',
  baseOfferRate: 9.1, appliedNmfRate: 10, reductionPercent: 20,
  agreementEligible: true, proofOfOriginAvailable: true,
}) });
if (noOrigin.eligible) throw new Error('non-EU origin incorrectly eligible');

const noProof = resolveMercosulEuIi({ ...({
  date: '2026-08-15', originCountryCode: 'DE', ncm: '3208.10.20',
  baseOfferRate: 9.1, appliedNmfRate: 10, reductionPercent: 20,
  agreementEligible: true, proofOfOriginAvailable: false,
}) });
if (noProof.payableRate !== null || noProof.automatic) throw new Error('preference applied without proof of origin');

console.log('mercosul-eu II resolution tests passed');
