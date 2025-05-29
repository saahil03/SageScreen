// Simple encryption utilities for demo purposes
// In production, use proper cryptographic libraries

export function generateConnectionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateDeviceId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Simple XOR encryption for demo purposes
export function encrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
}

export function decrypt(encryptedText: string, key: string): string {
  const text = atob(encryptedText);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

export function validateConnectionCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
