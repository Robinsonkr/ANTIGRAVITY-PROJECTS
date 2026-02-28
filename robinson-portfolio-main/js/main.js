// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateToggleIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateToggleIcon(next);
    });
}

function updateToggleIcon(theme) {
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Mobile Navigation Toggle
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-links li a").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
}));

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Intersection Observer for Scroll Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            entry.target.classList.add('show'); // Keep compatibility with existing classes

            // Stagger children animations if it's a grid
            if (entry.target.classList.contains('skills-grid') ||
                entry.target.classList.contains('projects-grid') ||
                entry.target.classList.contains('achievements-grid') ||
                entry.target.classList.contains('education-grid')) {
                const children = entry.target.children;
                Array.from(children).forEach((child, index) => {
                    child.style.transitionDelay = `${index * 100}ms`;
                    child.classList.add('active');
                    child.classList.add('show');
                });
            }
        }
    });
}, observerOptions);

// Initialize reveal elements
const revealElements = document.querySelectorAll('.reveal, .section, .hero, .project-card, .skill-card, .achievement-card, .education-item, .cert-item');
revealElements.forEach((el) => {
    if (!el.classList.contains('reveal')) {
        el.classList.add('hidden');
    }
    observer.observe(el);
});

// Scroll Progress Bar
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress-container';
progressBar.innerHTML = '<div class="scroll-progress-bar" id="scroll-bar"></div>';
document.body.prepend(progressBar);

window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const bar = document.getElementById('scroll-bar');
    if (bar) bar.style.width = scrolled + "%";
});

// Typing Effect
const textElement = document.querySelector('.typing-cursor');
if (textElement) {
    const text = "I build scalable backend systems.";
    textElement.textContent = "";
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            textElement.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    // Start typing after a short delay
    setTimeout(typeWriter, 1000);
}

// Scroll Indicator
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
    });

    // Hide on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '0.7';
        }
    });
}

// Contact Form Submission & Popup
const contactForm = document.getElementById('contact-form');
const confirmationPopup = document.getElementById('confirmation-popup');
const closePopupBtn = document.getElementById('close-popup');

if (contactForm) {
    contactForm.addEventListener('submit', () => {
        // We use a small timeout to let the iframe handle the request
        setTimeout(() => {
            confirmationPopup.classList.add('active');
            contactForm.reset();
        }, 500);
    });
}

if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
        confirmationPopup.classList.remove('active');
    });
}

// Close popup on outside click
window.addEventListener('click', (e) => {
    if (e.target === confirmationPopup) {
        confirmationPopup.classList.remove('active');
    }
});

// Analytics: Track Visitor
document.addEventListener('DOMContentLoaded', () => {
    // Fire and forget tracking call
    setTimeout(async () => {
        try {
            const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8000/track_visit'
                : 'https://antigravity-projects-dn90.onrender.com/track_visit';

            const pagePath = window.location.pathname || "index.html";

            await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ page: pagePath })
            });
        } catch (e) {
            // Silently fail if tracking is blocked by adblockers, etc.
            console.debug("Tracking ping blocked or failed.");
        }
    }, 1000); // 1 second delay to avoid delaying initial render
});

