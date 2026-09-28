import { describe, expect, it } from "vitest";
import { initialFormData, type FAFSAFormData } from "../types/form";
import {
  isAtLeast14,
  parseCurrency,
  validateField,
  validateForm,
} from "./validation";

const validApplication: FAFSAFormData = {
  ...initialFormData,
  firstName: "Jane",
  lastName: "Smith",
  ssn: "123-45-6789",
  dateOfBirth: "2003-05-15",
  dependencyStatus: "dependent",
  maritalStatus: "single",
  numberInHousehold: "4",
  numberInCollege: "1",
  studentIncome: "5000",
  parentIncome: "65000",
  stateOfResidence: "CA",
};

const invalidApplication: FAFSAFormData = {
  ...initialFormData,
  firstName: "John",
  lastName: "Doe",
  ssn: "invalid",
  dateOfBirth: "2015-01-01",
  dependencyStatus: "dependent",
  maritalStatus: "married",
  spouseFirstName: "",
  spouseLastName: "",
  spouseSsn: "",
  numberInHousehold: "2",
  numberInCollege: "5",
  studentIncome: "-1000",
  parentIncome: "",
  stateOfResidence: "",
};

describe("FAFSA validation", () => {
  describe("assignment sample applications", () => {
    it("accepts the valid application from the assignment", () => {
      expect(validateForm(validApplication)).toEqual({});
    });

    it("returns all expected errors for the invalid application from the assignment", () => {
      const errors = validateForm(invalidApplication);

      expect(errors).toMatchObject({
        ssn: "Use the format XXX-XX-XXXX.",
        dateOfBirth: "Student must be at least 14 years old.",
        spouseFirstName: "Enter the spouse’s first name.",
        spouseLastName: "Enter the spouse’s last name.",
        spouseSsn: "Enter the spouse’s Social Security number.",
        numberInCollege: "Number in college cannot exceed household size.",
        studentIncome: "Student income cannot be negative.",
        parentIncome: "Enter parent income for a dependent student.",
        stateOfResidence: "Select the student’s state of legal residence.",
      });
    });
  });

  describe("student age", () => {
    it("accepts a student who turns 14 today", () => {
      expect(isAtLeast14("2012-09-28", new Date("2026-09-28T12:00:00"))).toBe(
        true,
      );
    });

    it("rejects a student who turns 14 tomorrow", () => {
      expect(isAtLeast14("2012-09-29", new Date("2026-09-28T12:00:00"))).toBe(
        false,
      );
    });

    it("requires a date of birth", () => {
      expect(
        validateField("dateOfBirth", { ...validApplication, dateOfBirth: "" }),
      ).toBe("Enter the student’s date of birth.");
    });
  });

  describe("SSN format", () => {
    it("accepts XXX-XX-XXXX format", () => {
      expect(validateField("ssn", validApplication)).toBeUndefined();
    });

    it("rejects a 9 digit SSN without separators", () => {
      expect(
        validateField("ssn", { ...validApplication, ssn: "123456789" }),
      ).toBe("Use the format XXX-XX-XXXX.");
    });

    it("rejects an incorrectly formatted spouse SSN when married", () => {
      expect(
        validateField("spouseSsn", {
          ...validApplication,
          maritalStatus: "married",
          spouseFirstName: "Alex",
          spouseLastName: "Smith",
          spouseSsn: "123456789",
        }),
      ).toBe("Use the format XXX-XX-XXXX.");
    });
  });

  describe("dependency status and parent income", () => {
    it("requires parent income for a dependent student", () => {
      expect(
        validateField("parentIncome", {
          ...validApplication,
          parentIncome: "",
        }),
      ).toBe("Enter parent income for a dependent student.");
    });

    it("does not require parent income for an independent student", () => {
      expect(
        validateField("parentIncome", {
          ...validApplication,
          dependencyStatus: "independent",
          parentIncome: "",
        }),
      ).toBeUndefined();
    });
  });

  describe("income validation", () => {
    it("accepts zero income", () => {
      expect(
        validateField("studentIncome", {
          ...validApplication,
          studentIncome: "0",
        }),
      ).toBeUndefined();
    });

    it("accepts comma-formatted currency values", () => {
      expect(parseCurrency("65,000")).toBe(65000);
      expect(
        validateField("studentIncome", {
          ...validApplication,
          studentIncome: "65,000",
        }),
      ).toBeUndefined();
    });

    it("rejects negative student income", () => {
      expect(
        validateField("studentIncome", {
          ...validApplication,
          studentIncome: "-1",
        }),
      ).toBe("Student income cannot be negative.");
    });

    it("rejects negative parent income for a dependent student", () => {
      expect(
        validateField("parentIncome", {
          ...validApplication,
          parentIncome: "-1",
        }),
      ).toBe("Parent income cannot be negative.");
    });
  });

  describe("household rules", () => {
    it("requires household size to be at least 1", () => {
      expect(
        validateField("numberInHousehold", {
          ...validApplication,
          numberInHousehold: "0",
        }),
      ).toBe("Household size must be at least 1.");
    });

    it("requires number in college to be at least 1", () => {
      expect(
        validateField("numberInCollege", {
          ...validApplication,
          numberInCollege: "0",
        }),
      ).toBe("Number in college must be a whole number of at least 1.");
    });

    it("rejects number in college greater than household size", () => {
      expect(
        validateField("numberInCollege", {
          ...validApplication,
          numberInHousehold: "2",
          numberInCollege: "3",
        }),
      ).toBe("Number in college cannot exceed household size.");
    });

    it("accepts number in college equal to household size", () => {
      expect(
        validateField("numberInCollege", {
          ...validApplication,
          numberInHousehold: "2",
          numberInCollege: "2",
        }),
      ).toBeUndefined();
    });
  });

  describe("state of legal residence", () => {
    it("accepts a valid U.S. state code", () => {
      expect(
        validateField("stateOfResidence", {
          ...validApplication,
          stateOfResidence: "TX",
        }),
      ).toBeUndefined();
    });

    it("rejects an invalid state code", () => {
      expect(
        validateField("stateOfResidence", {
          ...validApplication,
          stateOfResidence: "ZZ",
        }),
      ).toBe("Select a valid U.S. state.");
    });

    it("requires a state selection", () => {
      expect(
        validateField("stateOfResidence", {
          ...validApplication,
          stateOfResidence: "",
        }),
      ).toBe("Select the student’s state of legal residence.");
    });
  });

  describe("marital status and spouse information", () => {
    it("requires all spouse fields when married", () => {
      const errors = validateForm({
        ...validApplication,
        maritalStatus: "married",
        spouseFirstName: "",
        spouseLastName: "",
        spouseSsn: "",
      });

      expect(errors.spouseFirstName).toBe("Enter the spouse’s first name.");
      expect(errors.spouseLastName).toBe("Enter the spouse’s last name.");
      expect(errors.spouseSsn).toBe(
        "Enter the spouse’s Social Security number.",
      );
    });

    it("does not validate spouse fields when single", () => {
      const errors = validateForm({
        ...validApplication,
        maritalStatus: "single",
        spouseFirstName: "",
        spouseLastName: "",
        spouseSsn: "invalid",
      });

      expect(errors.spouseFirstName).toBeUndefined();
      expect(errors.spouseLastName).toBeUndefined();
      expect(errors.spouseSsn).toBeUndefined();
    });
  });

  describe("required fields", () => {
    it("requires first and last name", () => {
      const errors = validateForm({
        ...validApplication,
        firstName: "   ",
        lastName: "",
      });

      expect(errors.firstName).toBe("Enter the student’s first name.");
      expect(errors.lastName).toBe("Enter the student’s last name.");
    });

    it("requires dependency and marital status selections", () => {
      const errors = validateForm({
        ...validApplication,
        dependencyStatus: "",
        maritalStatus: "",
      });

      expect(errors.dependencyStatus).toBe("Select a dependency status.");
      expect(errors.maritalStatus).toBe("Select a marital status.");
    });
  });
});
