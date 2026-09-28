import type { FAFSAFormData, FormErrors, FormField } from "../types/form";
import { US_STATE_CODES } from "./states";

const SSN_PATTERN = /^\d{3}-\d{2}-\d{4}$/;

const isBlank = (value: string) => value.trim() === "";

export const parseCurrency = (value: string): number =>
  Number(value.replace(/,/g, "").trim());

export function isAtLeast14(dateOfBirth: string, today = new Date()): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return false;

  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1;
  }
  return age >= 14;
}

export function validateField(
  field: FormField,
  data: FAFSAFormData,
): string | undefined {
  switch (field) {
    case "firstName":
      return isBlank(data.firstName)
        ? "Enter the student’s first name."
        : undefined;
    case "lastName":
      return isBlank(data.lastName)
        ? "Enter the student’s last name."
        : undefined;
    case "ssn":
      if (isBlank(data.ssn))
        return "Enter the student’s Social Security number.";
      return SSN_PATTERN.test(data.ssn)
        ? undefined
        : "Use the format XXX-XX-XXXX.";
    case "dateOfBirth":
      if (!data.dateOfBirth) return "Enter the student’s date of birth.";
      return isAtLeast14(data.dateOfBirth)
        ? undefined
        : "Student must be at least 14 years old.";
    case "dependencyStatus":
      return data.dependencyStatus ? undefined : "Select a dependency status.";
    case "maritalStatus":
      return data.maritalStatus ? undefined : "Select a marital status.";
    case "spouseFirstName":
      return data.maritalStatus === "married" && isBlank(data.spouseFirstName)
        ? "Enter the spouse’s first name."
        : undefined;
    case "spouseLastName":
      return data.maritalStatus === "married" && isBlank(data.spouseLastName)
        ? "Enter the spouse’s last name."
        : undefined;
    case "spouseSsn":
      if (data.maritalStatus !== "married") return undefined;
      if (isBlank(data.spouseSsn))
        return "Enter the spouse’s Social Security number.";
      return SSN_PATTERN.test(data.spouseSsn)
        ? undefined
        : "Use the format XXX-XX-XXXX.";
    case "numberInHousehold": {
      if (isBlank(data.numberInHousehold))
        return "Enter the number of people in the household.";
      const household = Number(data.numberInHousehold);
      return Number.isFinite(household) &&
        Number.isInteger(household) &&
        household >= 1
        ? undefined
        : "Household size must be at least 1.";
    }
    case "numberInCollege": {
      if (isBlank(data.numberInCollege))
        return "Enter the number of household members in college.";
      const inCollege = Number(data.numberInCollege);
      const household = Number(data.numberInHousehold);
      if (
        !Number.isFinite(inCollege) ||
        !Number.isInteger(inCollege) ||
        inCollege < 1
      )
        return "Number in college must be a whole number of at least 1.";
      if (
        Number.isFinite(household) &&
        household >= 1 &&
        inCollege > household
      ) {
        return "Number in college cannot exceed household size.";
      }
      return undefined;
    }
    case "studentIncome": {
      if (isBlank(data.studentIncome)) return "Enter the student’s income.";
      const value = parseCurrency(data.studentIncome);
      if (!Number.isFinite(value)) {
        return "Enter a valid income amount.";
      }

      if (value < 0) {
        return "Student income cannot be negative.";
      }

      return undefined;
    }
    case "parentIncome": {
      if (data.dependencyStatus !== "dependent") return undefined;
      if (isBlank(data.parentIncome))
        return "Enter parent income for a dependent student.";
      const value = parseCurrency(data.parentIncome);
      if (!Number.isFinite(value)) {
        return "Enter a valid income amount.";
      }

      if (value < 0) {
        return "Parent income cannot be negative.";
      }

      return undefined;
    }
    case "stateOfResidence":
      if (!data.stateOfResidence)
        return "Select the student’s state of legal residence.";
      return US_STATE_CODES.has(data.stateOfResidence)
        ? undefined
        : "Select a valid U.S. state.";
    default:
      return undefined;
  }
}

export function validateForm(data: FAFSAFormData): FormErrors {
  const fields = Object.keys(data) as FormField[];
  return fields.reduce<FormErrors>((errors, field) => {
    const error = validateField(field, data);
    if (error) errors[field] = error;
    return errors;
  }, {});
}
