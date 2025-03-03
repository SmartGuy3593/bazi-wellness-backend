import { isEmpty } from "../isEmpty/isEmpty.ts";

interface UserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  isValid?: boolean;
}

export const validateSignUp = (input: UserInput): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate firstName
  if (!input.firstName) {
    errors.firstName = "First name is required.";
  } else if (!/^[a-zA-Z]+$/.test(input.firstName)) {
    errors.firstName = "First name must contain only alphabetic characters.";
  }
  // Validate lastName
  if (!input.lastName) {
    errors.lastName = "Last name is required.";
  } else if (!/^[a-zA-Z]+$/.test(input.lastName)) {
    errors.lastName = "Last name must contain only alphabetic characters.";
  }
  // Validate email
  if (!input.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Email format is invalid.";
  }
  // Validate password
  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/[A-Z]/.test(input.password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(input.password)) {
    errors.password = "Password must contain at least one lowercase letter.";
  } else if (!/[0-9]/.test(input.password)) {
    errors.password = "Password must contain at least one digit.";
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(input.password)) {
    errors.password = "Password must contain at least one special character.";
  }

  errors.isValid = isEmpty(errors);

  return errors;
}

export const validateSignIn = (input: UserInput): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate email
  if (!input.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Email format is invalid.";
  }
  // Validate password
  if (!input.password) {
    errors.password = "Password is required.";
  }

  errors.isValid = isEmpty(errors);

  return errors;
}
