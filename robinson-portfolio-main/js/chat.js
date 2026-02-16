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
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        const id = 'typing-' + Date.now();
        typingDiv.id = id;
        typingDiv.classList.add('message', 'bot-message');
        typingDiv.textContent = '...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const typingDiv = document.getElementById(id);
        if (typingDiv) {
            typingDiv.remove();
        }
    }
});
