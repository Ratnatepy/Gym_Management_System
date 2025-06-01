// cart.js - Centralized cart management
class CartManager {
    static CART_KEY = 'gymCart';
    static PROMO_KEY = 'activePromo';

    static getCart() {
        return JSON.parse(localStorage.getItem(this.CART_KEY)) || [];
    }

    static saveCart(cart) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    }

    static addItem(newItem) {
        const cart = this.getCart();
        const existing = cart.find(item => item.name === newItem.name && item.options === newItem.options);

        if (existing) {
            existing.quantity += 1;
            existing.price = existing.originalPrice * existing.quantity;
        } else {
            newItem.quantity = 1;
            newItem.price = newItem.originalPrice;
            cart.push(newItem);
        }

        this.saveCart(cart);
        return cart;
    }

    static removeItem(index) {
        const cart = this.getCart();
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            this.saveCart(cart);
        }
        return cart;
    }

    static increaseQuantity(index) {
        const cart = this.getCart();
        if (cart[index]) {
            cart[index].quantity += 1;
            cart[index].price = cart[index].originalPrice * cart[index].quantity;
            this.saveCart(cart);
        }
    }

    static decreaseQuantity(index) {
        const cart = this.getCart();
        if (cart[index]) {
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                cart[index].price = cart[index].originalPrice * cart[index].quantity;
            } else {
                cart.splice(index, 1);
            }
            this.saveCart(cart);
        }
    }

    static clearCart() {
        localStorage.removeItem(this.CART_KEY);
    }

    static getPromo() {
        return JSON.parse(localStorage.getItem(this.PROMO_KEY)) || null;
    }

    static applyPromo(promoData) {
        localStorage.setItem(this.PROMO_KEY, JSON.stringify(promoData));
        return promoData;
    }

    static clearPromo() {
        localStorage.removeItem(this.PROMO_KEY);
    }

    static calculateTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            return total + price;
        }, 0);
    }
}
