/**
 * Test utilities - shared helpers for all frontend tests
 */
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { vi } from 'vitest';

const defaultTheme = {
    isDark: false,
    isHighContrast: false,
    toggleTheme: vi.fn(),
    toggleHighContrast: vi.fn(),
};

/** Render with all providers (Router + Theme). Pass custom theme via options. */
export function renderWithProviders(ui, { theme = {}, ...renderOptions } = {}) {
    const themeValue = { ...defaultTheme, ...theme };
    function Wrapper({ children }) {
        return (
            <BrowserRouter>
                <ThemeContext.Provider value={themeValue}>
                    {children}
                </ThemeContext.Provider>
            </BrowserRouter>
        );
    }
    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/** Create a mock API response for axios */
export function mockApiResponse(data, status = 200) {
    return Promise.resolve({ data: { success: true, data }, status });
}

/** Create a mock API error */
export function mockApiError(message = 'Error', status = 400) {
    const err = new Error(message);
    err.response = { data: { success: false, message }, status };
    return Promise.reject(err);
}
