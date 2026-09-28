import type { FormErrors, FormField } from '../types/form';

const labels: Partial<Record<FormField, string>> = {
  firstName: 'First name', lastName: 'Last name', ssn: 'Student SSN', dateOfBirth: 'Date of birth',
  dependencyStatus: 'Dependency status', maritalStatus: 'Marital status', spouseFirstName: 'Spouse first name',
  spouseLastName: 'Spouse last name', spouseSsn: 'Spouse SSN', numberInHousehold: 'Number in household',
  numberInCollege: 'Number in college', studentIncome: 'Student income', parentIncome: 'Parent income',
  stateOfResidence: 'State of legal residence'
};

export function ErrorSummary({ errors }: { errors: FormErrors }) {
  const entries = Object.entries(errors) as [FormField, string][];
  if (!entries.length) return null;

  return (
    <section className="error-summary" aria-labelledby="error-summary-title" tabIndex={-1}>
      <h2 id="error-summary-title">Please fix the following {entries.length === 1 ? 'error' : 'errors'}</h2>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field}`}>{labels[field] ?? field}: {message}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
