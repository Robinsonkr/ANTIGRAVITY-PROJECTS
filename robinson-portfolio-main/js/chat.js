/* Chatbot Logic */
document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Toggle Chat Window
    chatBubble.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
        if (chatWindow.style.display === 'flex') {
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });

    // Handle Sending Messages
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to UI
        addMessage(message, 'user');
        chatInput.value = '';

        // Add typing indicator
        const typingId = addTypingIndicator();

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }

            const data = await response.json();
            removeTypingIndicator(typingId);
            addMessage(data.response, 'bot');
        } catch (error) {
            console.error('Chat Error:', error);
            removeTypingIndicator(typingId);
            addMessage('Sorry, I am having trouble connecting to my brain right now. Please try again later.', 'bot');
        }
    });

    function addMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', `${sender}-wrapper`);

        if (sender === 'bot') {
            const avatar = document.createElement('img');
            avatar.src = 'images/profile_avatar.png';
            avatar.classList.add('message-avatar');
            avatar.alt = 'AI Avatar';
            wrapper.appendChild(avatar);
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;

        wrapper.appendChild(messageDiv);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.classList.add('message-wrapper', 'bot-wrapper');

        const avatar = document.createElement('img');
        avatar.src = 'images/profile_avatar.png';
        avatar.classList.add('message-avatar');
        avatar.alt = 'AI Avatar';
        wrapper.appendChild(avatar);

        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot-message');
        typingDiv.textContent = '...';

        wrapper.appendChild(typingDiv);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const typingWrapper = document.getElementById(id);
        if (typingWrapper) {
            typingWrapper.remove();
        }
    }
});
