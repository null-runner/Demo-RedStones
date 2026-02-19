import "@testing-library/jest-dom";

// ResizeObserver is not available in jsdom — polyfill for cmdk and other UI libs
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Radix UI uses pointer capture API not available in jsdom
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.releasePointerCapture = () => {};

// Radix UI uses scrollIntoView not available in jsdom
window.HTMLElement.prototype.scrollIntoView = () => {};
