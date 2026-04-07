import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';

// Mock authService to prevent side effects
vi.mock('../lib/authService', () => ({
    default: {
        getServerCart: vi.fn(() => Promise.resolve([])),
        syncCart: vi.fn(() => Promise.resolve()),
    },
}));

const mockProduct = {
    id: 'prod-1',
    name: 'Test Dress',
    price: 49.99,
    image: 'test.jpg',
};

const mockProduct2 = {
    id: 'prod-2',
    name: 'Test Bag',
    price: 89.99,
    image: 'test2.jpg',
};

function TestComponent() {
    const cart = useCart();
    return (
        <div>
            <div data-testid="cart-count">{cart.getItemCount()}</div>
            <div data-testid="cart-total">{cart.getTotal().toFixed(2)}</div>
            <div data-testid="cart-items">{JSON.stringify(cart.cartItems)}</div>
            <div data-testid="coupon">{cart.coupon ? cart.coupon.code : 'none'}</div>
            <button data-testid="add" onClick={() => cart.addToCart(mockProduct, 'M', 'Black')}>Add</button>
            <button data-testid="add2" onClick={() => cart.addToCart(mockProduct2, 'L', 'Tan')}>Add2</button>
            <button data-testid="remove" onClick={() => cart.removeFromCart('prod-1', 'M', 'Black')}>Remove</button>
            <button data-testid="update-qty" onClick={() => cart.updateQuantity('prod-1', 'M', 'Black', 3)}>SetQty3</button>
            <button data-testid="clear" onClick={() => cart.clearCart()}>Clear</button>
            <button data-testid="apply-patry10" onClick={() => {
                const result = cart.applyCoupon('PATRY10');
                document.querySelector('[data-testid="coupon-result"]').textContent = result.message;
            }}>ApplyPatry10</button>
            <button data-testid="apply-welcome20" onClick={() => {
                const result = cart.applyCoupon('WELCOME20');
                document.querySelector('[data-testid="coupon-result"]').textContent = result.message;
            }}>ApplyWelcome20</button>
            <button data-testid="apply-freeship" onClick={() => {
                const result = cart.applyCoupon('FREESHIP');
                document.querySelector('[data-testid="coupon-result"]').textContent = result.message;
            }}>ApplyFreeship</button>
            <button data-testid="apply-invalid" onClick={() => {
                const result = cart.applyCoupon('FAKE');
                document.querySelector('[data-testid="coupon-result"]').textContent = result.message;
            }}>ApplyInvalid</button>
            <div data-testid="coupon-result"></div>
            <div data-testid="discount">{cart.getDiscount().toFixed(2)}</div>
            <div data-testid="shipping">{cart.getShipping().toFixed(2)}</div>
        </div>
    );
}

function renderCart() {
    return render(
        <CartProvider>
            <TestComponent />
        </CartProvider>
    );
}

describe('CartContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('starts with empty cart', () => {
        renderCart();
        expect(screen.getByTestId('cart-count').textContent).toBe('0');
        expect(screen.getByTestId('cart-total').textContent).toBe('0.00');
    });

    it('adds item and increases cart count', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('1');
        expect(screen.getByTestId('cart-total').textContent).toBe('49.99');
    });

    it('increments quantity when adding same item again', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('add').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('2');
        expect(screen.getByTestId('cart-total').textContent).toBe('99.98');
    });

    it('removes item and decreases cart count', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('1');
        await act(async () => {
            screen.getByTestId('remove').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('0');
    });

    it('calculates total correctly with multiple products', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('add2').click();
        });
        // 49.99 + 89.99 = 139.98
        expect(screen.getByTestId('cart-total').textContent).toBe('139.98');
        expect(screen.getByTestId('cart-count').textContent).toBe('2');
    });

    it('updates quantity correctly', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('update-qty').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('3');
        expect(screen.getByTestId('cart-total').textContent).toBe('149.97');
    });

    it('clears cart', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('add2').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('2');
        await act(async () => {
            screen.getByTestId('clear').click();
        });
        expect(screen.getByTestId('cart-count').textContent).toBe('0');
    });

    it('applies PATRY10 coupon for 10% discount', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('apply-patry10').click();
        });
        expect(screen.getByTestId('coupon').textContent).toBe('PATRY10');
        expect(screen.getByTestId('coupon-result').textContent).toBe('10% discount applied!');
        // 10% of 49.99 = 5.00 (approximately)
        expect(screen.getByTestId('discount').textContent).toBe('5.00');
    });

    it('applies WELCOME20 coupon for 20% discount', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('apply-welcome20').click();
        });
        expect(screen.getByTestId('coupon').textContent).toBe('WELCOME20');
        expect(screen.getByTestId('coupon-result').textContent).toBe('20% discount applied!');
        expect(screen.getByTestId('discount').textContent).toBe('10.00');
    });

    it('applies FREESHIP coupon for free shipping', async () => {
        renderCart();
        // Add item under $50 so shipping would normally apply
        await act(async () => {
            screen.getByTestId('add').click();
        });
        await act(async () => {
            screen.getByTestId('apply-freeship').click();
        });
        expect(screen.getByTestId('coupon').textContent).toBe('FREESHIP');
        expect(screen.getByTestId('coupon-result').textContent).toBe('Free shipping applied!');
        expect(screen.getByTestId('shipping').textContent).toBe('0.00');
    });

    it('rejects invalid coupon code', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('apply-invalid').click();
        });
        expect(screen.getByTestId('coupon').textContent).toBe('none');
        expect(screen.getByTestId('coupon-result').textContent).toBe('Invalid coupon code');
    });

    it('persists cart to localStorage', async () => {
        renderCart();
        await act(async () => {
            screen.getByTestId('add').click();
        });
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'cart',
            expect.stringContaining('prod-1')
        );
    });
});
