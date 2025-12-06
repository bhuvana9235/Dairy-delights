// Write JS function to reserve a table, persist the data using Axios API

let currentReservationId = 0;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.reservation-form');
    const reservationIdField = document.getElementById('reservationid');
    const dateField = document.getElementById('date');
    const timeField = document.getElementById('time');

    fetchLastReservationId();
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);

    function fetchLastReservationId() {
        axios.get('http://localhost:7800/reservation')
            .then(response => {
                const reservations = Array.isArray(response.data) ? response.data : 
                                     (response.data.reservation || []);
                const lastReservation = reservations[reservations.length - 1];
                currentReservationId = generateNextReservationId(lastReservation ? lastReservation.reservationId : null);
                reservationIdField.value = currentReservationId;
            })
            .catch(error => {
                console.error('Error fetching last reservation ID:', error);
                reservationIdField.value = 'ERROR';
            });
    }

    function generateNextReservationId(lastReservationId) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const reservationNumber = lastReservationId ?
            String(parseInt(lastReservationId.slice(-4)) + 1).padStart(4, '0') :
            '0001';
        
        return `RES${year}${month}${reservationNumber}`;
    }

    window.validateForm = function() {
        const requiredFields = ['name', 'email', 'phone', 'date', 'time', 'persons'];
        const missingFields = requiredFields.filter(field => {
            const element = document.getElementById(field);
            return !element || !element.value.trim();
        });

        if (missingFields.length === 0) {
            reservationIdField.value = currentReservationId;
            reservationIdField.style.display = 'block';
            return true;
        } else {
            const errorMessage = 'Please fill in the following fields:\n' +
                missingFields.map(field => `- ${field.charAt(0).toUpperCase() + field.slice(1)}`).join('\n');
            alert(errorMessage);
            reservationIdField.style.display = 'none';
            return false;
        }
    }

    window.submitReservation = function() {
        if (!validateForm()) return;
    
        const reservationDetails = {
            id: generateUniqueId(),
            reservationId: currentReservationId,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            persons: document.getElementById('persons').value
        };
    
        axios.post('http://localhost:7800/reservation', reservationDetails)
            .then(response => {
                console.log('Reservation saved:', response.data);
                alert(`Reservation successful!\nReservation ID: ${currentReservationId}`);
                currentReservationId = generateNextReservationId(currentReservationId);
                document.getElementById('reservationid').value = currentReservationId;
                clearReservationForm();
            })
            .catch(error => {
                console.error('Error saving reservation:', error);
                alert('Failed to save reservation. Please try again.');
            });
    };
    

    function updateCurrentDateTime() {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);
        dateField.value = currentDate;
        timeField.value = currentTime;
    }

    function clearReservationForm() {
        ['name', 'email', 'phone', 'persons'].forEach(id => {
            document.getElementById(id).value = '';
        });
        updateCurrentDateTime();
    }

    function generateUniqueId() {
        return Math.random().toString(36).substr(2, 4);
    }

    document.querySelectorAll('.reservation-form input, .reservation-form select').forEach(field => {
        field.addEventListener('input', () => {
            const allFilled = Array.from(document.querySelectorAll('.reservation-form [required]')).every(field => field.value.trim() !== '');
            reservationIdField.style.display = allFilled ? 'block' : 'none';
        });
    });

    reservationIdField.style.display = 'none';
});

