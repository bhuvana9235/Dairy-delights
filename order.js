// Write JS code to dynamically add order form fields 
// Write JS function to submit and persist the order details using Axios API

let currentOrderId = 0;

document.addEventListener('DOMContentLoaded', function() {
    const orderItemsContainer = document.getElementById('orderItemsContainer');
    let orderItems = [];
    let totalAmount = 0;

    loadOrderFromLocalStorage();
    fetchLastOrderId();
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);

    function loadOrderFromLocalStorage() {
        const currentOrder = JSON.parse(localStorage.getItem('currentOrder')) || [];
        orderItems = currentOrder.reduce((acc, item) => {
            const existingItem = acc.find(orderItem => 
                orderItem.itemName === item.itemName && 
                orderItem.categoryName === item.categoryName &&
                orderItem.price === item.price
            );
            
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                acc.push({...item});
            }
            return acc;
        }, []);
        
        updateOrderItemsDisplay();
        updateTotalAmount();
    }

    function fetchLastOrderId() {
        axios.get('http://localhost:7700/order')
            .then(response => {
                const successfulOrders = response.data.filter(order => order.status === 'success');
                const lastOrder = successfulOrders[successfulOrders.length - 1];
                currentOrderId = generateNextOrderId(lastOrder ? lastOrder.orderId : null);
                document.getElementById('orderId').value = currentOrderId;
            })
            .catch(error => {
                console.error('Error fetching last order ID:', error);
                document.getElementById('orderId').value = 'ERROR';
            });
    }

    function generateNextOrderId(lastOrderId) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const orderNumber = lastOrderId ? 
            String(parseInt(lastOrderId.slice(-4)) + 1).padStart(4, '0') : 
            '0001';
        
        return `ORD${year}${month}${orderNumber}`;
    }

    window.validateForm = function() {
        const requiredFields = ['customerName', 'emailId', 'contactNumber', 'orderDateandtime', 'address'];
        const missingFields = requiredFields.filter(field => {
            const element = document.getElementById(field);
            return !element || !element.value.trim();
        });

        if (missingFields.length === 0) {
            const orderIdField = document.getElementById('orderId');
            orderIdField.value = currentOrderId;
            orderIdField.style.display = 'block';
            return true;
        } else {
            const errorMessage = 'Please fill in the following fields:\n' + 
                missingFields.map(field => `- ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`).join('\n');
            alert(errorMessage);
            document.getElementById('orderId').style.display = 'none';
            return false;
        }
    }

    function updateOrderItemsDisplay() {
        orderItemsContainer.innerHTML = orderItems.map((item, index) => `
            <tr>
                <td>${item.categoryName}</td>
                <td>${item.itemName}</td>
                <td>${item.price}</td>
                <td>${item.quantity}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td><button class="remove-btn" onclick="removeOrderItem(${index})">Remove</button></td>
            </tr>
        `).join('');
    }

    window.removeOrderItem = function(index) {
        orderItems.splice(index, 1);
        updateOrderItemsDisplay();
        updateTotalAmount();
        localStorage.setItem('currentOrder', JSON.stringify(orderItems));
    }

    function updateTotalAmount() {
        totalAmount = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);
    }

    window.submitOrder = function() {
        if (orderItems.length === 0) {
            alert('Please add items to your order from the menu page before submitting.');
            return;
        }

        if (!validateForm()) return;

        const orderDetails = {
            orderId: currentOrderId,
            customerName: document.getElementById('customerName').value,
            emailId: document.getElementById('emailId').value,
            contactNumber: document.getElementById('contactNumber').value,
            orderDate_and_time: document.getElementById('orderDateandtime').value,
            address: document.getElementById('address').value,
            items: orderItems,
            totalAmount: totalAmount,
            status: 'success'
        };

        axios.post('http://localhost:7700/order', orderDetails)
            .then(response => {
                console.log('Order saved:', response.data);
                const mainCourseCount = orderItems.filter(item => item.categoryName.toLowerCase() === 'main course').length;
                const message = mainCourseCount >= 2 ? 'The order is eligible for a free soft drink!' : '';
                alert(`Order placed successfully!\nOrder ID: ${currentOrderId} \nTotal amount to be paid: INR ${totalAmount.toFixed(2)}\n${message}`);
                currentOrderId = generateNextOrderId(currentOrderId);
                document.getElementById('orderId').value = currentOrderId;
                clearOrderForm();
            })
            .catch(error => {
                console.error('Error saving order:', error);
                alert('Failed to save order. Please try again.');
                storeFailedOrder(orderDetails);
            });
    }

    function storeFailedOrder(orderDetails) {
        axios.post('http://localhost:7900/failed_order', orderDetails)
            .then(response => console.log('Failed order stored:', response.data))
            .catch(error => console.error('Error storing failed order:', error));
    }

    function updateCurrentDateTime() {
        const now = new Date();
        const dateTimeString = now.toISOString().slice(0, 19).replace('T', ' ');
        document.getElementById('orderDateandtime').value = dateTimeString;
    }

    function clearOrderForm() {
        ['customerName', 'emailId', 'contactNumber', 'address'].forEach(id => {
            document.getElementById(id).value = '';
        });
        orderItems = [];
        totalAmount = 0;
        updateOrderItemsDisplay();
        updateTotalAmount();
        localStorage.removeItem('currentOrder');
        updateCurrentDateTime();
    }

    document.querySelectorAll('#orderForm input, #orderForm textarea').forEach(field => {
        field.addEventListener('input', () => {
            const orderIdField = document.getElementById('orderId');
            const allFilled = Array.from(document.querySelectorAll('#orderForm [required]')).every(field => field.value.trim() !== '');
            orderIdField.style.display = allFilled ? 'block' : 'none';
        });
    });

    document.getElementById('orderId').style.display = 'none';
    
    window.addEventListener('orderUpdated', loadOrderFromLocalStorage);
});

