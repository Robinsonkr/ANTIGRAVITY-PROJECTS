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

        // Reset the login button state
        const submitBtn = document.getElementById('login-btn');
        submitBtn.innerHTML = `
            <span>Authenticate</span>
            <i class="fas fa-arrow-right"></i>
        `;
        submitBtn.disabled = false;
        errorMsg.style.display = 'none';
    });

    async function verifyTokenAndLoadDashboard(token) {
        try {
            const dashboardUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8000/admin/visitors'
                : 'https://antigravity-projects-dn90.onrender.com/admin/visitors';

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
                document.getElementById('welcome-msg').textContent = "Welcome to the confidential admin area, admin!";
                document.getElementById('stat-queries').textContent = "152"; // Mocked for now
                document.getElementById('stat-views').textContent = data.total_views;
                document.getElementById('stat-messages').textContent = "5"; // Mocked for now

                // Populate visitors table
                const tbody = document.getElementById('visitors-tbody');
                if (data.visitors && data.visitors.length > 0) {
                    tbody.innerHTML = '';
                    data.visitors.forEach(v => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${v.timestamp}</td>
                            <td>${v.ip_address}</td>
                            <td><span class="badge ${v.page_visited.includes('resume') ? 'badge-resume' : 'badge-home'}">${v.page_visited}</span></td>
                            <td class="user-agent-cell" title="${v.user_agent}">${parseUserAgent(v.user_agent)}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No visitors recorded yet.</td></tr>';
                }
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

    // Helper to extract a shorter, readable browser/OS string from the raw User-Agent
    function parseUserAgent(uaString) {
        if (!uaString || uaString === "Unknown") return "Unknown Device";
        let browser = "Web Browser";
        let os = "Unknown OS";

        // Detect OS
        if (uaString.includes("Windows")) os = "Windows";
        else if (uaString.includes("Mac OS X")) os = "macOS";
        else if (uaString.includes("Android")) os = "Android";
        else if (uaString.includes("Linux")) os = "Linux";
        else if (uaString.includes("iPhone") || uaString.includes("iPad")) os = "iOS";

        // Detect Browser
        if (uaString.includes("Chrome") && !uaString.includes("Edg") && !uaString.includes("OPR")) browser = "Chrome";
        else if (uaString.includes("Safari") && !uaString.includes("Chrome")) browser = "Safari";
        else if (uaString.includes("Firefox")) browser = "Firefox";
        else if (uaString.includes("Edg")) browser = "Edge";
        else if (uaString.includes("OPR") || uaString.includes("Opera")) browser = "Opera";

        return `${browser} on ${os}`;
    }
});
