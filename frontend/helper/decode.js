
export function base64Decode(str) {

  if(!str || typeof str !== 'string') {
    // console.log('Invalid input for base64 decoding');
        return null;
    }
  try {
    const standardBase64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const decodedString = atob(standardBase64);
    return JSON.parse(decodedString);
  } catch (e) {
    // console.log('Error occurred during base64 decoding:', e);
    console.error('Failed to decode base64 string:', e);
    return null;
  }
}