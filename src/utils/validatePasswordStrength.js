export const validatePasswordStrength = (password) => {

    if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character"
    if (!/.{8,}/.test(password)) return "Password must be at least 8 characters long."
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter."
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter."
    if (!/[0-9]/.test(password)) return "Password must contain at least one number."
    return true
};

export default validatePasswordStrength;
