import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ErrorSummary } from "./components/ErrorSummary";
import { FormField } from "./components/FormField";
import {
  initialFormData,
  type FAFSAFormData,
  type FormErrors,
  type FormField as FormFieldName,
} from "./types/form";
import { US_STATES } from "./utils/states";
import { parseCurrency, validateField, validateForm } from "./utils/validation";
import "./App.css";

function describedBy(id: string, error?: string, hint?: boolean) {
  return (
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");

export default function App() {
  const [formData, setFormData] = useState<FAFSAFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<FormFieldName, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const visibleErrors = useMemo(() => errors, [errors]);

  const updateField = (field: FormFieldName, value: string) => {
    setSubmitted(false);

    setFormData((current) => {
      const next = { ...current, [field]: value } as FAFSAFormData;

      if (field === "maritalStatus" && value !== "married") {
        next.spouseFirstName = "";
        next.spouseLastName = "";
        next.spouseSsn = "";
      }

      if (field === "dependencyStatus" && value !== "dependent") {
        next.parentIncome = "";
      }

      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };

        if (touched[field] || currentErrors[field]) {
          const error = validateField(field, next);
          if (error) nextErrors[field] = error;
          else delete nextErrors[field];
        }

        if (
          field === "numberInHousehold" &&
          (touched.numberInCollege || currentErrors.numberInCollege)
        ) {
          const relatedError = validateField("numberInCollege", next);
          if (relatedError) nextErrors.numberInCollege = relatedError;
          else delete nextErrors.numberInCollege;
        }

        if (field === "maritalStatus" && value !== "married") {
          delete nextErrors.spouseFirstName;
          delete nextErrors.spouseLastName;
          delete nextErrors.spouseSsn;
        }

        if (field === "dependencyStatus" && value !== "dependent") {
          delete nextErrors.parentIncome;
        }

        return nextErrors;
      });

      return next;
    });
  };

  const handleBlur = (field: FormFieldName) => {
    setTouched((current) => ({ ...current, [field]: true }));

    const error = validateField(field, formData);

    setErrors((current) => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  const inputProps = (field: FormFieldName, hint = false) => ({
    id: field,
    name: field,
    value: formData[field],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      updateField(field, event.target.value),
    onBlur: () => handleBlur(field),
    "aria-invalid": Boolean(errors[field]) || undefined,
    "aria-describedby": describedBy(field, errors[field], hint),
  });

  const handleSsnChange = (field: "ssn" | "spouseSsn", value: string) => {
    const digits = onlyDigits(value).slice(0, 9);
    const formatted = digits
      .replace(/^(\d{3})(\d)/, "$1-$2")
      .replace(/^(\d{3}-\d{2})(\d)/, "$1-$2");

    updateField(field, formatted);
  };

  const handleWholeNumberChange = (
    field:
      | "numberInHousehold"
      | "numberInCollege"
      | "studentIncome"
      | "parentIncome",
    value: string,
  ) => {
    updateField(field, onlyDigits(value));
  };

  const handleCurrencyBlur = (field: "studentIncome" | "parentIncome") => {
    const currentValue = formData[field];

    if (currentValue.trim() !== "") {
      const amount = parseCurrency(currentValue);

      if (Number.isFinite(amount)) {
        const formatted = new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(amount);

        const next = { ...formData, [field]: formatted };
        setFormData(next);

        const error = validateField(field, next);
        setErrors((current) => {
          const nextErrors = { ...current };
          if (error) nextErrors[field] = error;
          else delete nextErrors[field];
          return nextErrors;
        });

        setTouched((current) => ({ ...current, [field]: true }));
        return;
      }
    }

    handleBlur(field);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateForm(formData);
    setErrors(nextErrors);

    const allTouched = (Object.keys(formData) as FormFieldName[]).reduce<
      Partial<Record<FormFieldName, boolean>>
    >((acc, field) => ({ ...acc, [field]: true }), {});

    setTouched(allTouched);

    if (Object.keys(nextErrors).length) {
      setSubmitted(false);
      requestAnimationFrame(() =>
        errorSummaryRef.current
          ?.querySelector<HTMLElement>(".error-summary")
          ?.focus(),
      );
      return;
    }

    setSubmitted(true);
  };

  return (
    <main className="page-shell">
      <div className="form-card">
        <header className="page-header">
          <p className="eyebrow">Student Aid Application</p>
          <h1>FAFSA Application Form</h1>
          <p>
            Enter the requested information below. Fields marked with an
            asterisk are required.
          </p>
        </header>

        <div ref={errorSummaryRef}>
          <ErrorSummary errors={visibleErrors} />
        </div>

        {submitted && (
          <div className="success-message" role="status" tabIndex={-1}>
            <h2>Application passed validation</h2>
            <p>All required information has been entered successfully.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <section aria-labelledby="student-info-heading">
            <h2 id="student-info-heading">Student Information</h2>
            <div className="field-grid">
              <FormField
                id="firstName"
                label="First Name"
                required
                error={errors.firstName}
              >
                <input
                  type="text"
                  autoComplete="given-name"
                  {...inputProps("firstName")}
                />
              </FormField>

              <FormField
                id="lastName"
                label="Last Name"
                required
                error={errors.lastName}
              >
                <input
                  type="text"
                  autoComplete="family-name"
                  {...inputProps("lastName")}
                />
              </FormField>

              <FormField
                id="ssn"
                label="Social Security Number"
                required
                error={errors.ssn}
                hint="Format: XXX-XX-XXXX"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  {...inputProps("ssn", true)}
                  onChange={(event) =>
                    handleSsnChange("ssn", event.target.value)
                  }
                />
              </FormField>

              <FormField
                id="dateOfBirth"
                label="Date of Birth"
                required
                error={errors.dateOfBirth}
              >
                <input
                  type="date"
                  autoComplete="bday"
                  {...inputProps("dateOfBirth")}
                />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="status-heading">
            <h2 id="status-heading">Status Information</h2>
            <div className="field-grid">
              <fieldset
                id="dependencyStatus"
                className={
                  errors.dependencyStatus
                    ? "radio-group radio-group--error"
                    : "radio-group"
                }
              >
                <legend>
                  Dependency Status{" "}
                  <span className="required" aria-hidden="true">
                    *
                  </span>
                </legend>

                <div className="radio-options">
                  {["dependent", "independent"].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="dependencyStatus"
                        value={value}
                        checked={formData.dependencyStatus === value}
                        onChange={(event) =>
                          updateField("dependencyStatus", event.target.value)
                        }
                        onBlur={() => handleBlur("dependencyStatus")}
                        aria-invalid={
                          Boolean(errors.dependencyStatus) || undefined
                        }
                        aria-describedby={
                          errors.dependencyStatus
                            ? "dependencyStatus-error"
                            : undefined
                        }
                      />
                      {value[0].toUpperCase() + value.slice(1)}
                    </label>
                  ))}
                </div>

                {errors.dependencyStatus && (
                  <p
                    className="field-error"
                    id="dependencyStatus-error"
                    role="alert"
                  >
                    {errors.dependencyStatus}
                  </p>
                )}
              </fieldset>

              <fieldset
                id="maritalStatus"
                className={
                  errors.maritalStatus
                    ? "radio-group radio-group--error"
                    : "radio-group"
                }
              >
                <legend>
                  Marital Status{" "}
                  <span className="required" aria-hidden="true">
                    *
                  </span>
                </legend>

                <div className="radio-options">
                  {["single", "married"].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="maritalStatus"
                        value={value}
                        checked={formData.maritalStatus === value}
                        onChange={(event) =>
                          updateField("maritalStatus", event.target.value)
                        }
                        onBlur={() => handleBlur("maritalStatus")}
                        aria-invalid={
                          Boolean(errors.maritalStatus) || undefined
                        }
                        aria-describedby={
                          errors.maritalStatus
                            ? "maritalStatus-error"
                            : undefined
                        }
                      />
                      {value[0].toUpperCase() + value.slice(1)}
                    </label>
                  ))}
                </div>

                {errors.maritalStatus && (
                  <p
                    className="field-error"
                    id="maritalStatus-error"
                    role="alert"
                  >
                    {errors.maritalStatus}
                  </p>
                )}
              </fieldset>
            </div>
          </section>

          {formData.maritalStatus === "married" && (
            <section aria-labelledby="spouse-heading">
              <h2 id="spouse-heading">Spouse Information</h2>
              <div className="field-grid">
                <FormField
                  id="spouseFirstName"
                  label="Spouse First Name"
                  required
                  error={errors.spouseFirstName}
                >
                  <input
                    type="text"
                    autoComplete="given-name"
                    {...inputProps("spouseFirstName")}
                  />
                </FormField>

                <FormField
                  id="spouseLastName"
                  label="Spouse Last Name"
                  required
                  error={errors.spouseLastName}
                >
                  <input
                    type="text"
                    autoComplete="family-name"
                    {...inputProps("spouseLastName")}
                  />
                </FormField>

                <FormField
                  id="spouseSsn"
                  label="Spouse Social Security Number"
                  required
                  error={errors.spouseSsn}
                  hint="Format: XXX-XX-XXXX"
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={11}
                    {...inputProps("spouseSsn", true)}
                    onChange={(event) =>
                      handleSsnChange("spouseSsn", event.target.value)
                    }
                  />
                </FormField>
              </div>
            </section>
          )}

          <section aria-labelledby="household-heading">
            <h2 id="household-heading">Household Information</h2>
            <div className="field-grid">
              <FormField
                id="numberInHousehold"
                label="Number in Household"
                required
                error={errors.numberInHousehold}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...inputProps("numberInHousehold")}
                  onChange={(event) =>
                    handleWholeNumberChange(
                      "numberInHousehold",
                      event.target.value,
                    )
                  }
                />
              </FormField>

              <FormField
                id="numberInCollege"
                label="Number in College"
                required
                error={errors.numberInCollege}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...inputProps("numberInCollege")}
                  onChange={(event) =>
                    handleWholeNumberChange(
                      "numberInCollege",
                      event.target.value,
                    )
                  }
                />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="financial-heading">
            <h2 id="financial-heading">Financial Information</h2>
            <div className="field-grid">
              <FormField
                id="studentIncome"
                label="Student Income"
                required
                error={errors.studentIncome}
                hint="Enter whole dollars, for example 5000."
              >
                <div className="currency-input">
                  <span aria-hidden="true">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    {...inputProps("studentIncome", true)}
                    onChange={(event) =>
                      handleWholeNumberChange(
                        "studentIncome",
                        event.target.value,
                      )
                    }
                    onBlur={() => handleCurrencyBlur("studentIncome")}
                  />
                </div>
              </FormField>

              {formData.dependencyStatus === "dependent" && (
                <FormField
                  id="parentIncome"
                  label="Parent Income"
                  required
                  error={errors.parentIncome}
                  hint="Required for dependent students. Enter whole dollars."
                >
                  <div className="currency-input">
                    <span aria-hidden="true">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...inputProps("parentIncome", true)}
                      onChange={(event) =>
                        handleWholeNumberChange(
                          "parentIncome",
                          event.target.value,
                        )
                      }
                      onBlur={() => handleCurrencyBlur("parentIncome")}
                    />
                  </div>
                </FormField>
              )}
            </div>
          </section>

          <section aria-labelledby="residence-heading">
            <h2 id="residence-heading">Residence</h2>
            <FormField
              id="stateOfResidence"
              label="State of Legal Residence"
              required
              error={errors.stateOfResidence}
            >
              <select {...inputProps("stateOfResidence")}>
                <option value="">Select a state</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </FormField>
          </section>

          <div className="form-actions">
            <button type="submit">Submit Application</button>
          </div>
        </form>
      </div>
    </main>
  );
}
