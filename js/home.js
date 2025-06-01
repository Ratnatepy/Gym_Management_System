document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:5000/api';

    // Animated counters
    const memberCounter = document.querySelector('#stats .stat-card:nth-child(1) .counter');
    const trainerCounter = document.querySelector('#stats .stat-card:nth-child(2) .counter');
    const speed = 200;

    function animateCounter(counter, target) {
        let count = 0;
        const increment = target / speed;
        function update() {
            count += increment;
            if (count < target) {
                counter.innerText = Math.ceil(count);
                requestAnimationFrame(update);
            } else {
                counter.innerText = target;
            }
        }
        update();
    }

    // Fetch total members
    fetch(`${API_BASE_URL}/members/count`)
        .then(res => res.json())
        .then(data => {
            if (data.totalMembers !== undefined) {
                animateCounter(memberCounter, data.totalMembers);
            }
        })
        .catch(() => {
            memberCounter.innerText = 'N/A';
        });

    // Fetch total trainers
    fetch(`${API_BASE_URL}/trainers/count`)
        .then(res => res.json())
        .then(data => {
            if (data.totalTrainers !== undefined) {
                animateCounter(trainerCounter, data.totalTrainers);
            }
        })
        .catch(() => {
            trainerCounter.innerText = 'N/A';
        });

    // Promotion buttons
    if (typeof CartManager !== 'undefined') {
        document.querySelectorAll('.apply-promo').forEach(button => {
            button.addEventListener('click', function() {
                const promoType = this.getAttribute('data-promo');
                const discount = parseInt(this.getAttribute('data-discount'));
                const discountType = this.getAttribute('data-type');

                const cart = CartManager.getCart();
                const updatedCart = cart.map(item => {
                    if ((discountType === 'membership' && item.type === 'membership') ||
                        (discountType === 'shop' && item.type === 'shop')) {
                        return {
                            ...item,
                            price: item.originalPrice * (1 - discount / 100),
                            discountApplied: true
                        };
                    }
                    return item;
                });

                CartManager.saveCart(updatedCart);
                CartManager.applyPromo({
                    type: promoType,
                    discount,
                    discountType,
                    applied: true
                });

                alert(`Promotion applied! You'll see the discount at checkout.`);
                window.location.href = 'payments.html';
            });
        });
    } else {
        console.error('CartManager is not available.');
    }
});
