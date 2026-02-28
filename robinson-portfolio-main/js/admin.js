document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const errorMsg = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Check if user is already logged in securely
    const token = localStorage.getItem('adminToken');
    if (token) {
        verifyTokenAndLoadDashboard(token);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('login-btn');
        const originalBtnHtml = submitBtn.innerHTML;

        // UI Loading State
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span> Authenticating...</span>';
        submitBtn.disabled = true;
        errorMsg.style.display = 'none';

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            // Use dynamic URL based on environment
            const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8000/token'
                : 'https://antigravity-projects-dn90.onrender.com/token';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('adminToken', data.access_token);
                // Success! Load Dashboard
                verifyTokenAndLoadDashboard(data.access_token);
            } else {
                // Incorrect credentials
                errorMsg.style.display = 'block';
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login Error:', error);
            errorMsg.innerHTML = 'Network error. Backend unreachable.';
            errorMsg.style.display = 'block';
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
        loginForm.reset();
    });

    async function verifyTokenAndLoadDashboard(token) {
        try {
            const dashboardUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8000/admin/dashboard_data'
                : 'https://antigravity-projects-dn90.onrender.com/admin/dashboard_data';

            const response = await fetch(dashboardUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Switch UI smoothly
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';

                // Populate secure dashboard items from the FastAPI backend
                document.getElementById('welcome-msg').textContent = data.message;
                document.getElementById('stat-queries').textContent = data.stats.chatbot_queries;
                document.getElementById('stat-views').textContent = data.stats.portfolio_views;
                document.getElementById('stat-messages').textContent = data.stats.new_messages;
            } else {
                // Token invalid or expired
                localStorage.removeItem('adminToken');
                loginSection.style.display = 'block';
                dashboardSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Verify error:', error);
            // If the backend drops out, assume token still okay locally until explicit 401
        }
    }
});
