// utils/validate.js
export const validateRequiredFields = (form, requiredFields) => {
  const errors = {};
  requiredFields.forEach((field) => {
    if (!form[field] || String(form[field]).trim() === "") {
      errors[field] = true; // true = inválido
    }
  });
  return errors;
};
