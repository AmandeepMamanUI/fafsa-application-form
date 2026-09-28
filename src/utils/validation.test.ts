import { describe, expect, it } from 'vitest';
import { initialFormData } from '../types/form';
import { isAtLeast14, validateForm } from './validation';

describe('validation', () => {
  it('requires a student to be at least 14', () => {
    expect(isAtLeast14('2012-09-28', new Date('2026-09-28T12:00:00'))).toBe(true);
    expect(isAtLeast14('2012-09-29', new Date('2026-09-28T12:00:00'))).toBe(false);
  });

  it('returns the assignment validation errors for invalid data', () => {
    const errors = validateForm({
      ...initialFormData,
      firstName: 'John',
      lastName: 'Doe',
      ssn: 'invalid',
      dateOfBirth: '2015-01-01',
      dependencyStatus: 'dependent',
      maritalStatus: 'married',
      numberInHousehold: '2',
      numberInCollege: '5',
      studentIncome: '-1000',
      parentIncome: '',
      stateOfResidence: ''
    });

    expect(errors.ssn).toBeDefined();
    expect(errors.dateOfBirth).toBeDefined();
    expect(errors.parentIncome).toBeDefined();
    expect(errors.spouseFirstName).toBeDefined();
    expect(errors.spouseLastName).toBeDefined();
    expect(errors.spouseSsn).toBeDefined();
    expect(errors.studentIncome).toBeDefined();
    expect(errors.numberInCollege).toBeDefined();
    expect(errors.stateOfResidence).toBeDefined();
  });

  it('accepts the provided valid sample data', () => {
    const errors = validateForm({
      ...initialFormData,
      firstName: 'Jane',
      lastName: 'Smith',
      ssn: '123-45-6789',
      dateOfBirth: '2003-05-15',
      dependencyStatus: 'dependent',
      maritalStatus: 'single',
      numberInHousehold: '4',
      numberInCollege: '1',
      studentIncome: '5000',
      parentIncome: '65000',
      stateOfResidence: 'CA'
    });
    expect(errors).toEqual({});
  });
});
