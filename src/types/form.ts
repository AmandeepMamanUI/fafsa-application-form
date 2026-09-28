export type DependencyStatus = '' | 'dependent' | 'independent';
export type MaritalStatus = '' | 'single' | 'married';

export type FormField = keyof FAFSAFormData;

export interface FAFSAFormData {
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  dependencyStatus: DependencyStatus;
  maritalStatus: MaritalStatus;
  spouseFirstName: string;
  spouseLastName: string;
  spouseSsn: string;
  numberInHousehold: string;
  numberInCollege: string;
  studentIncome: string;
  parentIncome: string;
  stateOfResidence: string;
}

export type FormErrors = Partial<Record<FormField, string>>;

export const initialFormData: FAFSAFormData = {
  firstName: '',
  lastName: '',
  ssn: '',
  dateOfBirth: '',
  dependencyStatus: '',
  maritalStatus: '',
  spouseFirstName: '',
  spouseLastName: '',
  spouseSsn: '',
  numberInHousehold: '',
  numberInCollege: '',
  studentIncome: '',
  parentIncome: '',
  stateOfResidence: ''
};
