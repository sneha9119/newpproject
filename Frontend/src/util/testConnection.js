import axios from 'axios';

// Function to test backend connectivity
const testBackendConnection = async (url) => {
  try {
    console.log(`Testing connection to: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log('Connection successful!', response.status);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('Connection failed:', error.message);
    return {
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    };
  }
};

export default testBackendConnection; 