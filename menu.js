// Write code for fetching menu details using Axios API

document.addEventListener('DOMContentLoaded', fetchMenu);
document.addEventListener('DOMContentLoaded', function() {
    const proceedToOrderBtn = document.getElementById('proceedToOrderBtn');
    proceedToOrderBtn.addEventListener('click', function(event) {
        let currentOrder = JSON.parse(localStorage.getItem('currentOrder')) || [];
        if (currentOrder.length === 0) {
            event.preventDefault();
            alert('Please add items to your cart before proceeding to the order page.');
        } else {
            window.location.href = 'order.html';
        }
    });
});

function fetchMenu() {
    axios.get('http://localhost:7600/menu')
        .then(response => {
            displayMenu(response.data);
        })
        .catch(error => console.error('Error fetching menu:', error));
}

function displayMenu(menuItems) {
    const menuTableBody = document.querySelector('#menuTable tbody');
    menuTableBody.innerHTML = ''; 

    menuItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.category}</td>
            <td>${item.itemName}</td>  
            <td>${item.price}</td>
             <td>
                <button class="quantity-btn minus" onclick="decrementQuantity(this)">-</button>
                <input type="number" class="quantity-input" value="0" min="0">
                <button class="quantity-btn plus" onclick="incrementQuantity(this)">+</button>
            </td>
            <td><button class="order-btn" data-item="${item.itemName}" data-price="${item.price}" data-category="${item.category}">Add to Cart</button></td>
            <td><span class="ordered-quantity">0</span></td>
        `;
        menuTableBody.appendChild(row);
    });

    // Add event listeners to the order buttons
    document.querySelectorAll('.order-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-item');
            const price = this.getAttribute('data-price');
            const quantityInput = this.parentNode.previousElementSibling.querySelector('.quantity-input');
            const quantity = quantityInput.value;
            const category = this.getAttribute('data-category');
            addToOrder(itemName, price, quantity, category);
            
            // Set quantity to 0
            quantityInput.value = '0';
            updateOrderedQuantity(this, quantity);
        });
    });
    
}

function incrementQuantity(button) {
    const input = button.previousElementSibling;
    input.value = parseInt(input.value) + 1;
}

function decrementQuantity(button) {
    const input = button.nextElementSibling;
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
    }
}

function updateOrderedQuantity(button, quantity) {
    const orderedQuantitySpan = button.parentNode.nextElementSibling.querySelector('.ordered-quantity');
    const currentQuantity = parseInt(orderedQuantitySpan.textContent);
    orderedQuantitySpan.textContent = currentQuantity + parseInt(quantity);
}


function addToOrder(itemName, price, quantity, category) {
    const orderItem = {
        itemName: itemName,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        categoryName: category
    };

    let currentOrder = JSON.parse(localStorage.getItem('currentOrder')) || [];
    currentOrder.push(orderItem);
    localStorage.setItem('currentOrder', JSON.stringify(currentOrder));

    // alert(`Added ${quantity} ${itemName}(s) to your order.`);
    // window.dispatchEvent(new CustomEvent('orderUpdated'));
}





function filterMenu() {
    const category = document.getElementById('categoryFilter').value;

    axios.get('http://localhost:7600/menu')
        .then(response => {
            const menuItems = response.data;
            const filteredItems = category === 'All' ? menuItems : menuItems.filter(item => item.category === category);
            displayMenu(filteredItems);
        })
        .catch(error => console.error('Error filtering menu:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    const categoryHeader = document.querySelector('th:first-child');
    const orderedHeader = document.querySelector('th:last-child');

    categoryHeader.addEventListener('click', () => sortTable(0, 'alpha'));
    orderedHeader.addEventListener('click', () => sortTable(5, 'numeric'));
});

function sortTable(columnIndex, type) {
    const table = document.getElementById('menuTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();

        if (type === 'numeric') {
            return parseInt(aValue) - parseInt(bValue);
        } else {
            return aValue.localeCompare(bValue);
        }
    });

    // Toggle sort direction
    if (table.getAttribute('data-sort-dir') === 'asc') {
        rows.reverse();
        table.setAttribute('data-sort-dir', 'desc');
    } else {
        table.setAttribute('data-sort-dir', 'asc');
    }

    // Re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

