// Main application logic
class TreasureHuntGame {
    constructor() {
        this.wordBank = document.getElementById('wordBank');
        this.dropZone = document.getElementById('dropZone');
        this.submitBtn = document.getElementById('submitBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.modal = document.getElementById('resultModal');
        this.closeModalBtn = document.getElementById('closeModal');
        
        this.currentAnswer = [];
        this.draggedElement = null;
        
        this.init();
    }

    async init() {
        // Shuffle words for randomness
        const shuffledWords = this.shuffleArray([...CONFIG.words]);
        
        // Create word elements
        shuffledWords.forEach((word, index) => {
            this.createWordElement(word, index);
        });

        // Create drop slots
        for (let i = 0; i < CONFIG.words.length; i++) {
            this.createDropSlot(i);
        }

        // Make word bank accept drops
        this.setupWordBankDropZone();

        // Add event listeners
        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
    }

    createWordElement(word, index) {
        const wordEl = document.createElement('div');
        wordEl.className = 'word';
        wordEl.textContent = word;
        wordEl.draggable = true;
        wordEl.dataset.word = word;
        wordEl.dataset.id = `word-${index}`;

        // Drag events
        wordEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
        wordEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

        this.wordBank.appendChild(wordEl);
    }

    createDropSlot(position) {
        const slot = document.createElement('div');
        slot.className = 'drop-slot';
        slot.dataset.position = position + 1;
        slot.dataset.slotIndex = position;

        // Drop events
        slot.addEventListener('dragover', (e) => this.handleDragOver(e));
        slot.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        slot.addEventListener('drop', (e) => this.handleDrop(e));

        this.dropZone.appendChild(slot);
    }

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        const slot = e.currentTarget;
        if (!slot.querySelector('.word')) {
            slot.classList.add('drag-over');
        }
        
        return false;
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();

        const slot = e.currentTarget;
        slot.classList.remove('drag-over');

        // Check if slot is empty
        if (!slot.querySelector('.word') && this.draggedElement) {
            // Remove from old parent
            const oldParent = this.draggedElement.parentNode;
            if (oldParent.classList.contains('drop-slot')) {
                oldParent.classList.remove('filled');
            }

            // Add to new slot
            slot.appendChild(this.draggedElement);
            slot.classList.add('filled');
            
            // Update current answer
            this.updateCurrentAnswer();
        }

        return false;
    }

    setupWordBankDropZone() {
        // Allow dropping words back to word bank
        this.wordBank.addEventListener('dragover', (e) => {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            this.wordBank.classList.add('drag-over');
            return false;
        });

        this.wordBank.addEventListener('dragleave', (e) => {
            this.wordBank.classList.remove('drag-over');
        });

        this.wordBank.addEventListener('drop', (e) => {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            e.preventDefault();
            
            this.wordBank.classList.remove('drag-over');
            
            if (this.draggedElement) {
                // Remove from old parent (drop slot)
                const oldParent = this.draggedElement.parentNode;
                if (oldParent.classList.contains('drop-slot')) {
                    oldParent.classList.remove('filled');
                }
                
                // Add back to word bank
                this.wordBank.appendChild(this.draggedElement);
                
                // Update current answer
                this.updateCurrentAnswer();
            }
            
            return false;
        });
    }

    updateCurrentAnswer() {
        this.currentAnswer = [];
        const slots = this.dropZone.querySelectorAll('.drop-slot');
        
        slots.forEach((slot) => {
            const word = slot.querySelector('.word');
            if (word) {
                this.currentAnswer.push(word.dataset.word);
            } else {
                this.currentAnswer.push(null);
            }
        });
    }

    async checkAnswer() {
        this.updateCurrentAnswer();
        
        // Check if all slots are filled
        if (this.currentAnswer.includes(null)) {
            this.showModal('Incomplete!', 'Please fill all slots before submitting.', null);
            return;
        }

        // Create answer string
        const answerString = this.currentAnswer.join(' ');
        
        // Hash the answer
        const answerHash = await this.hashString(answerString);
        
        // Check against stored hash
        if (answerHash === CONFIG.correctAnswerHash) {
            // Decrypt flag using the correct answer as the key
            const flag = await this.decryptFlag(CONFIG.encryptedFlag, answerString);
            this.showModal('🎉 Congratulations! 🎉', 'You found the treasure!', flag);
        } else {
            this.showModal('❌ Incorrect', 'That\'s not the right combination. Try again!', null);
        }
    }

    async hashString(str) {
        // Use SHA-256 to hash the string
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async decryptFlag(encryptedData, key) {
        // Decrypt flag using AES-256-CBC with the correct answer as key
        try {
            // Split IV and encrypted data
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                return 'FLAG_DECRYPT_ERROR';
            }
            
            const iv = this.hexToBuffer(parts[0]);
            const encrypted = this.hexToBuffer(parts[1]);
            
            // Derive key from answer using SHA-256
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const keyHash = await crypto.subtle.digest('SHA-256', keyData);
            
            // Import key for decryption
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyHash,
                { name: 'AES-CBC' },
                false,
                ['decrypt']
            );
            
            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv: iv },
                cryptoKey,
                encrypted
            );
            
            // Convert to string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (e) {
            console.error('Decryption error:', e);
            return 'FLAG_DECRYPT_ERROR';
        }
    }
    
    hexToBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    showModal(title, message, flag) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        
        const flagDisplay = document.getElementById('flagDisplay');
        if (flag) {
            flagDisplay.textContent = flag;
            flagDisplay.style.display = 'block';
        } else {
            flagDisplay.style.display = 'none';
        }
        
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    reset() {
        // Move all words back to word bank
        const words = this.dropZone.querySelectorAll('.word');
        words.forEach(word => {
            this.wordBank.appendChild(word);
        });

        // Clear all slots
        const slots = this.dropZone.querySelectorAll('.drop-slot');
        slots.forEach(slot => {
            slot.classList.remove('filled');
        });

        this.currentAnswer = [];
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TreasureHuntGame();
});
