import './password-strength-bar.scss';

import React from 'react';
import { Translate } from 'react-jhipster';

import { NEUTRAL_COLOR, STRENGTH_COLORS, describePasswordStrength, measurePasswordStrength } from 'app/shared/util/form-validation';

export interface IPasswordStrengthBarProps {
  password: string;
}

export const PasswordStrengthBar = ({ password }: IPasswordStrengthBarProps) => {
  const strength = describePasswordStrength(measurePasswordStrength(password));

  const points = STRENGTH_COLORS.map((col, index) => (
    <li key={col} className="point" style={{ backgroundColor: index < strength.idx ? strength.col : NEUTRAL_COLOR }} />
  ));

  return (
    <div id="strength">
      <small>
        <Translate contentKey="global.messages.validate.newpassword.strength">Password strength:</Translate>
      </small>
      <ul id="strengthBar">{points}</ul>
    </div>
  );
};

export default PasswordStrengthBar;
