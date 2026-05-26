// Lendr palette — ink as the primary, green reserved for affordance/price.
// Variable keys keep the legacy `amber` name so downstream code that consumed
// the original tokens still works after the rebrand to near-black ink.
export const COLORS = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSub: '#F4F4F8',
  surfaceInput: '#FAFAFC',

  // Primary — near-black ink
  amber: '#0F1115',
  amberLight: '#F4F4F8',
  amberDark: '#1F2937',

  // Secondary — price / "Active" status
  green: '#2E9B6A',
  greenLight: '#E4F4ED',

  // Danger
  red: '#D9534F',
  redLight: '#FFD5D5',

  // Neutral text
  text1: '#111827',
  text2: '#4B5563',
  text3: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderInput: '#E8E8F0',
  borderFocus: '#0F1115',

  // Auth/onboarding ink — slightly cooler
  inkOnboarding1: '#1A1A2E',
  inkOnboarding3: '#9B9BAA',
};
