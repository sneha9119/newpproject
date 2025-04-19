import { toast } from "react-toastify";
import axios from "axios";

const ApiCall = async (url, method, navigate, setUser, data) => {
  console.log("******** Inside ApiCall function ********");
  
  // Format URL to use the proxy setup for absolute URLs
  const formattedUrl = formatApiUrl(url);
  console.log("Using API URL:", formattedUrl);

  if (method === "GET") {
    try {
      const response = await axios.get(formattedUrl);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      setUser(null);
      if (error.response.status === 401) {
        toast.error("You are not authorized to access this page. Please login first.");
        navigate("/login");
      } else if (error.response.status === 404) {
        toast.error("The requested resource was not found.");
        navigate("/");
      } else if (error.response.status === 500) {
        toast.error("Server Error. Please try again later.");
        navigate("/");
      } else {
        toast.error("An error occurred. Please try again later.");
        navigate("/");
      }
    }
  } else if (method === "POST") {
    try {
      const response = await axios.post(formattedUrl, data);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      setUser(null);
      if (error.response.status === 401) {
        toast.error("You are not authorized to access this page. Please login first.");
        navigate("/login");
      } else if (error.response.status === 404) {
        toast.error("The requested resource was not found.");
        navigate("/");
      } else if (error.response.status === 500) {
        toast.error("Server Error. Please try again later.");
        navigate("/");
      } else {
        toast.error("An error occurred. Please try again later.");
        navigate("/");
      }
    }
  }
};

// Helper function to format API URLs for proxy compatibility
function formatApiUrl(url) {
  // If we're in production and using the Netlify proxy
  if (!import.meta.env.DEV && url.startsWith('http')) {
    // Convert absolute URLs to relative ones that will use the proxy
    try {
      const urlObj = new URL(url);
      // If the URL is to our backend, format it to use the proxy
      if (urlObj.origin === import.meta.env.VITE_SERVER_URL) {
        return `/api${urlObj.pathname}${urlObj.search}`;
      }
    } catch (e) {
      console.error("Error parsing URL:", e);
    }
  }
  return url;
}

export default ApiCall;
