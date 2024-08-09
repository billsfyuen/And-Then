export function identifyInput(input) {

    if (isEmptyOrSpace(input)) {
        return 'unknown'
        
    } else {
        // Regular expression patterns for email and username
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernamePattern = /^[a-zA-Z0-9_]+$/;

        if (emailPattern.test(input)) {
            return 'email';
        } else if (usernamePattern.test(input)) {
            return 'username';
        } else {
            return 'unknown';
        }
    }
};

export function isEmptyOrSpace(input) {
    if (input === undefined) {
        return true;
    }
    const trimmed = input.trim();
    return trimmed.length === 0;
};


//Password requirement:
//must be as least 10 characters long
//contains: uppercase letters, lowercase letters, numbers and symbols
export function isPasswordValid(password) {
    if (password.length < 10) {
        return false;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSymbol;
}