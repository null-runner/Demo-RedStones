import "@testing-library/jest-dom";

// ResizeObserver is not available in jsdom — polyfill for cmdk and other UI libs
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
