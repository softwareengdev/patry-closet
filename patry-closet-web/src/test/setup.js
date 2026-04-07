import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) { this.callback = callback; }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const store = {};
const mockLocalStorage = {
  getItem: vi.fn((key) => store[key] || null),
  setItem: vi.fn((key, value) => { store[key] = String(value); }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
