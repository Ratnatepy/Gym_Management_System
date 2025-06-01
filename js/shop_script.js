document.addEventListener('DOMContentLoaded', function () {
    const cartItems = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout');

    if (typeof CartManager === 'undefined') {
        console.error('CartManager not found!');
        return;
    }

    updateCartDisplay();

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseFloat(this.getAttribute('data-price'));
            const parentCard = this.closest('.card');
            let options = '';

            if (parentCard) {
                const sugarSelect = parentCard.querySelector('.sugar-option');
                const iceSelect = parentCard.querySelector('.ice-option');

                if (sugarSelect && iceSelect) {
                    options = ` (${sugarSelect.value}, ${iceSelect.value})`;
                }
            }

            CartManager.addItem({
                id: Date.now(),
                type: 'shop',
                name: itemName,
                price: itemPrice,
                originalPrice: itemPrice,
                options: options
            });

            updateCartDisplay();
        });
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            if (CartManager.getCart().length === 0) {
                alert('Your cart is empty!');
                return;
            }
            window.location.href = 'payments.html';
        });
    }

    function updateCartDisplay() {
        if (!cartItems || !totalPriceElement) return;

        const cart = CartManager.getCart();
        cartItems.innerHTML = '';

        if (cart.length === 0) {
            cartItems.innerHTML = '<li class="empty-cart">Your cart is empty</li>';
            totalPriceElement.textContent = '0.00';
            return;
        }

        cart.forEach((item, index) => {
            const subtotal = item.originalPrice * item.quantity;
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="cart-item-name">${item.name}${item.options || ''}</span>
                <div class="cart-item-details">
                    <button class="qty-btn decrease" data-index="${index}">−</button>
                    <span class="qty-count">Qty: ${item.quantity}</span>
                    <button class="qty-btn increase" data-index="${index}">+</button>
                    <span class="price-info">× $${item.originalPrice.toFixed(2)} = 
                        <strong>$${subtotal.toFixed(2)}</strong>
                    </span>
                    <button class="remove-item" data-index="${index}" title="Remove item">×</button>
                </div>
            `;
            cartItems.appendChild(li);
        });

        // Remove item
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                CartManager.removeItem(index);
                updateCartDisplay();
            });
        });

        // Quantity increase
        document.querySelectorAll('.qty-btn.increase').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                CartManager.increaseQuantity(index);
                updateCartDisplay();
            });
        });

        // Quantity decrease
        document.querySelectorAll('.qty-btn.decrease').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                CartManager.decreaseQuantity(index);
                updateCartDisplay();
            });
        });

        totalPriceElement.textContent = CartManager.calculateTotal().toFixed(2);
    }
});
