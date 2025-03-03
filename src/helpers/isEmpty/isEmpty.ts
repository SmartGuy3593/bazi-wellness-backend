const isEmpty = (value: unknown): boolean => {
  // Check for null or undefined
  if (value == null) {
    return true;
  }
  // Check for empty string
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  // Check for empty array
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  // Check for empty object
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  // If it's none of the above, it's not empty
  return false;
}

export { isEmpty };