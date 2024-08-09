//generate password for social login new users
export function generatePassword(length: number) {

  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  const allChars = uppercaseChars + lowercaseChars + numberChars + symbolChars;

  let password = '';

  for (let i = 0; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password;
}


//generate random string char
export function generateRandomString(length: number) {

  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return result;
}

//generate random string char
export function generateRandomNumChar(length: number) {

  const charset = '0123456789';

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return result;
}