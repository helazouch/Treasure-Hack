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
        const shuffledWords = this.shuffleArray([...CONFIG.words]);
        
        shuffledWords.forEach((word, index) => {
            this.createWordElement(word, index);
        });

        for (let i = 0; i < CONFIG.answerLength; i++) {
            this.createDropSlot(i);
        }

        this.setupWordBankDropZone();

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

        wordEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
        wordEl.addEventListener('dragend', (e) => this.handleDragEnd(e));

        this.wordBank.appendChild(wordEl);
    }

    createDropSlot(position) {
        const slot = document.createElement('div');
        slot.className = 'drop-slot';
        slot.dataset.position = position + 1;
        slot.dataset.slotIndex = position;

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

        if (!slot.querySelector('.word') && this.draggedElement) {
            const oldParent = this.draggedElement.parentNode;
            if (oldParent.classList.contains('drop-slot')) {
                oldParent.classList.remove('filled');
            }

            slot.appendChild(this.draggedElement);
            slot.classList.add('filled');
            
            this.updateCurrentAnswer();
        }

        return false;
    }

    setupWordBankDropZone() {
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
                const oldParent = this.draggedElement.parentNode;
                if (oldParent.classList.contains('drop-slot')) {
                    oldParent.classList.remove('filled');
                }
                
                this.wordBank.appendChild(this.draggedElement);
                
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
        
        if (this.currentAnswer.includes(null)) {
            this.showModal('Incomplete!', 'Please fill all slots before submitting.', null);
            return;
        }

        const answerString = this.currentAnswer.join(' ');
        
        const answerHash = await this.hashString(answerString);
        
        if (answerHash === CONFIG.correctAnswerHash) {
            const flag = await this.decryptFlag(CONFIG.encryptedFlag, answerString);
            this.showModal('🎉 Congratulations! 🎉', 'You found the flag!', flag);
        } else {
            this.showModal('❌ Incorrect', 'That\'s not the right combination. Try again!', null);
        }
    }

    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async decryptFlag(encryptedData, key) {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                return 'FLAG_DECRYPT_ERROR';
            }
            
            const iv = this.hexToBuffer(parts[0]);
            const encrypted = this.hexToBuffer(parts[1]);
            
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const keyHash = await crypto.subtle.digest('SHA-256', keyData);
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyHash,
                { name: 'AES-CBC' },
                false,
                ['decrypt']
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv: iv },
                cryptoKey,
                encrypted
            );
            
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
        const words = this.dropZone.querySelectorAll('.word');
        words.forEach(word => {
            this.wordBank.appendChild(word);
        });

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

document.addEventListener('DOMContentLoaded', () => {
    new TreasureHuntGame();
});
