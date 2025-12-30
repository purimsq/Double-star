document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS Animation
    try {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 50
            });
        }
    } catch (err) {
        console.warn('AOS Animation failed to initialize:', err);
    }

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu-overlay a');

    function toggleMenu() {
        if (mobileOverlay.style.display === 'none' || mobileOverlay.style.display === '') {
            mobileOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            mobileOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
    if (closeMenu) closeMenu.addEventListener('click', toggleMenu);
    mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // Header Scroll Effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- FORM HANDLING & VALIDATION ---
    const form = document.getElementById('contactForm');
    const serviceSelect = document.getElementById('serviceSelect');
    const otherServiceGroup = document.getElementById('otherServiceGroup');
    const otherServiceInput = document.getElementById('otherServiceInput');

    // Toggle "Other" input logic
    if (serviceSelect && otherServiceGroup) {
        serviceSelect.addEventListener('change', () => {
            if (serviceSelect.value === 'Other') {
                otherServiceGroup.classList.remove('hidden');
                otherServiceInput.setAttribute('required', 'true');
            } else {
                otherServiceGroup.classList.add('hidden');
                otherServiceInput.removeAttribute('required');
                otherServiceInput.value = '';
                clearError(otherServiceInput);
            }
        });
    }

    // Validation Helpers
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        let errorDisplay = formGroup.querySelector('.error-message');

        if (!errorDisplay) {
            errorDisplay = document.createElement('small');
            errorDisplay.className = 'error-message';
            formGroup.appendChild(errorDisplay);
        }

        input.classList.add('is-invalid');
        errorDisplay.textContent = message;
    }

    function clearError(input) {
        const formGroup = input.closest('.form-group');
        const errorDisplay = formGroup.querySelector('.error-message');
        input.classList.remove('is-invalid');
        if (errorDisplay) {
            errorDisplay.remove();
        }
    }

    // Real-time validation clear
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    clearError(input);
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get inputs
            const nameInput = form.querySelector('input[placeholder="Your Name"]');
            const phoneInput = document.getElementById('contactPhone');
            const emailInput = document.getElementById('contactEmail');
            const messageInput = form.querySelector('textarea');
            const btn = form.querySelector('button');
            const originalText = btn.innerText;

            // Values
            const nameVal = nameInput.value.trim();
            const emailVal = emailInput.value.trim();
            const phoneVal = phoneInput.value.trim();
            const serviceVal = serviceSelect.value;
            const otherVal = otherServiceInput ? otherServiceInput.value.trim() : '';
            const msgVal = messageInput.value.trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            // Phone Regex: 10 to 15 digits, allows +, -, space. Strict length check for Kenya (usually 10 or 12).
            // Checking for at least 10 digits to block 9 digit inputs.
            const phoneRegex = /^[\d\+\-\s]{10,15}$/;
            const digitCount = phoneVal.replace(/\D/g, '').length;

            let isValid = true;

            // --- Validation ---
            if (nameVal.length < 3) {
                showError(nameInput, "Name must be at least 3 characters.");
                isValid = false;
            } else {
                clearError(nameInput);
            }

            if (!emailRegex.test(emailVal)) {
                showError(emailInput, "Please enter a valid email address.");
                isValid = false;
            } else {
                clearError(emailInput);
            }

            if (digitCount < 10) {
                showError(phoneInput, "Phone number must be at least 10 digits.");
                isValid = false;
            } else if (!phoneRegex.test(phoneVal)) {
                showError(phoneInput, "Please enter a valid phone number.");
                isValid = false;
            } else {
                clearError(phoneInput);
            }

            if (serviceVal === 'Other' && otherVal === '') {
                showError(otherServiceInput, "Please describe the service you need.");
                isValid = false;
            } else {
                if (otherServiceInput) clearError(otherServiceInput);
            }

            if (!isValid) return;

            // --- Sending ---
            btn.innerText = 'Sending...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            try {
                // Send to Vercel Serverless Function (relative path works for both local 'vercel dev' and production)
                // Note: For local testing without 'vercel dev', you might need the full localhost URL, 
                // but for deployment, relative is mandatory.
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: nameVal,
                        phone: phoneVal,
                        email: emailVal,
                        service: serviceVal,
                        otherDetail: otherVal,
                        message: msgVal
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    btn.innerText = 'Message Sent! We will get back to you soon.';
                    btn.style.backgroundColor = '#10B981';
                    form.reset();
                    if (otherServiceGroup) {
                        otherServiceGroup.classList.add('hidden');
                        otherServiceInput.removeAttribute('required');
                    }
                } else {
                    throw new Error(result.message || 'Failed to send');
                }
            } catch (error) {
                console.error('Email error:', error);
                btn.innerText = 'Failed. Retry?';
                btn.style.backgroundColor = '#EF4444'; // Red
                // Only show alert for server errors as they are global
                alert("Error sending email: Check console or server connection.");
            } finally {
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // Business Status Logic
    function updateBusinessStatus() {
        const statusBadge = document.getElementById('business-status');
        if (!statusBadge) return;

        const now = new Date();
        const options = { timeZone: 'Africa/Nairobi', hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);

        const day = parts.find(p => p.type === 'weekday').value;
        const hour = parseInt(parts.find(p => p.type === 'hour').value);

        // Mon-Fri: 8-17, Sat: 8-14
        let isOpen = false;
        if (day !== 'Sun') {
            if (day === 'Sat') isOpen = (hour >= 8 && hour < 14);
            else isOpen = (hour >= 8 && hour < 17);
        }

        if (isOpen) {
            statusBadge.textContent = 'Open Now';
            statusBadge.classList.remove('closed');
            statusBadge.classList.add('open');
        } else {
            statusBadge.textContent = 'Closed Now';
            statusBadge.classList.remove('open');
            statusBadge.classList.add('closed');
        }
    }
    updateBusinessStatus();
    setInterval(updateBusinessStatus, 60000);
});
