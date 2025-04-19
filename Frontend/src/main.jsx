// Import polyfill first to ensure it's loaded before any other code
import './nodePolyfill.js';

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import { UserContextProvider } from "./util/UserContext.jsx";

if (import.meta.env.DEV) {
  console.log("Running in development mode");
  axios.defaults.baseURL = import.meta.env.VITE_LOCALHOST;
  // For local development, withCredentials is usually needed
  axios.defaults.withCredentials = true;
} else {
  console.log("Running in production mode");
  axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;
  // For production with different domains, check if cookies are needed
  // If you're getting CORS errors, try setting this to false
  axios.defaults.withCredentials = true; // Change to false if having CORS issues
}

// Add this line for debugging in production
console.log("API URL being used:", axios.defaults.baseURL);
console.log("withCredentials setting:", axios.defaults.withCredentials);

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <UserContextProvider>
      <App />
    </UserContextProvider>
  </Router>
);
