import { isEmail } from 'react-jhipster';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 50;
export const MAX_NAME_LENGTH = 50;
export const MAX_EMAIL_LENGTH = 254;

export const STRENGTH_COLORS = ['#F00', '#F90', '#FF0', '#9F0', '#0F0'];
export const NEUTRAL_COLOR = '#DDD';

export type PasswordStrength = {
  /** 1 based index of the filled bar, 0 when the score is too low to show any. */
  idx: number;
  col: string;
};

const CHARACTER_CLASSES = {
  lowerLetters: /[a-z]+/,
  upperLetters: /[A-Z]+/,
  numbers: /\d+/,
  symbols: /[$(-/:-@[-`!-[^-~]/,
};

const countCharacterClasses = (password: string): number =>
  Object.values(CHARACTER_CLASSES).filter(pattern => pattern.test(password)).length;

const ENTROPY_POOL = 26 + 26 + 10 + 32;

export const measurePasswordStrength = (password: string): number => {
  if (!password) {
    return 0;
  }

  const passedMatches = countCharacterClasses(password);

  let force = 2 * password.length + (password.length >= 10 ? 1 : 0);
  force += passedMatches * 10;

  force = password.length <= 6 ? Math.min(force, 10) : force;
  force = passedMatches === 1 ? Math.min(force, 10) : force;
  force = passedMatches === 2 ? Math.min(force, 20) : force;
  force = passedMatches === 3 ? Math.min(force, 40) : force;

  return Math.min(force, ENTROPY_POOL);
};

export const toPasswordStrength = (score: number): PasswordStrength => {
  const thresholds = [10, 20, 30, 40];
  const idx = thresholds.findIndex(threshold => score <= threshold);

  return idx === -1 ? { idx: STRENGTH_COLORS.length, col: STRENGTH_COLORS.at(-1)! } : { idx, col: STRENGTH_COLORS[idx] };
};

export const describePasswordStrength = (score: number): PasswordStrength => toPasswordStrength(score);

export const isPasswordAcceptable = (password: string): boolean => {
  if (!password || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }
  return countCharacterClasses(password) >= 2;
};

export const normaliseEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean => {
  const candidate = normaliseEmail(email);
  return candidate.length <= MAX_EMAIL_LENGTH && isEmail(candidate);
};

export const isValidName = (name: string): boolean => {
  const candidate = name;
  return candidate.length > 0 && candidate.length <= MAX_NAME_LENGTH;
};

export const passwordsMatch = (password: string, confirmation: string): boolean =>
  normaliseEmail(password) === normaliseEmail(confirmation);
