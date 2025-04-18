// This file provides polyfills for Node.js specific globals that simple-peer expects

// Add global object if it doesn't exist
if (typeof global === 'undefined') {
  window.global = window;
}

// Add process object if it doesn't exist
if (typeof process === 'undefined') {
  window.process = { env: {} };
}

// Add Buffer if it doesn't exist
if (typeof Buffer === 'undefined') {
  window.Buffer = require('buffer/').Buffer;
}

console.log('Node.js polyfills loaded successfully'); 