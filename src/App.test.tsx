import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('FAFSA form', () => {
  it('shows spouse fields only when married is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText(/spouse first name/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /married/i }));
    expect(screen.getByLabelText(/spouse first name/i)).toBeInTheDocument();
  });

  it('shows parent income only for dependent students', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText(/parent income/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /dependent/i }));
    expect(screen.getByLabelText(/parent income/i)).toBeInTheDocument();
  });

  it('validates on blur and links the error to the input', async () => {
    const user = userEvent.setup();
    render(<App />);

    const ssn = screen.getByLabelText(/social security number/i);
    await user.type(ssn, '123');
    await user.tab();

    expect(screen.getByText('Use the format XXX-XX-XXXX.')).toBeInTheDocument();
    expect(ssn).toHaveAttribute('aria-invalid', 'true');
    expect(ssn.getAttribute('aria-describedby')).toContain('ssn-error');
  });

  it('shows an error summary when an invalid form is submitted', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /review application/i }));
    expect(screen.getByRole('heading', { name: /please fix the following errors/i })).toBeInTheDocument();
  });
});
