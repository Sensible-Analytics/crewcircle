import { Alert } from 'react-native';

export const handleError = (error: any, context: string = '') => {
  console.error(`Error in ${context}:`, error);
  
  if (error.code) {
    return `Error ${error.code}: ${error.message}`;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const showErrorAlert = (error: any, context: string = '') => {
  const message = handleError(error, context);
  Alert.alert('Error', message);
};

export default { handleError, showErrorAlert };