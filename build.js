const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function parseEnvFile(filePath) {
    const envContent = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            env[key.trim()] = value;
        }
    });
    
    return env;
}

function hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

function encryptFlag(flag, key) {
    const keyHash = crypto.createHash('sha256').update(key).digest();
    
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
    
    let encrypted = cipher.update(flag, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
}

function build() {
    try {
        console.log('🔨 Building configuration...\n');
        
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            console.error('❌ Error: .env file not found!');
            console.log('Please create a .env file with CORRECT_ANSWER, FLAG, and WORDS');
            process.exit(1);
        }
        
        const env = parseEnvFile(envPath);
        
        if (!env.CORRECT_ANSWER || !env.FLAG || !env.WORDS) {
            console.error('❌ Error: Missing required fields in .env file');
            console.log('Required fields: CORRECT_ANSWER, FLAG, WORDS');
            process.exit(1);
        }
        
        const correctAnswer = env.CORRECT_ANSWER;
        const flag = env.FLAG;
        const correctWords = env.WORDS.split(',').map(w => w.trim());
        const distractorWords = env.DISTRACTOR_WORDS ? env.DISTRACTOR_WORDS.split(',').map(w => w.trim()) : [];
        
        const allWords = [...correctWords, ...distractorWords];
        
        const correctAnswerHash = hashString(correctAnswer);
        
        const encryptedFlag = encryptFlag(flag, correctAnswer);
        
        console.log('✅ Configuration processed:');
        console.log(`   - Correct words: ${correctWords.length}`);
        console.log(`   - Distractor words: ${distractorWords.length}`);
        console.log(`   - Total words in bank: ${allWords.length}`);
        console.log(`   - Answer hash: ${correctAnswerHash.substring(0, 16)}...`);
        console.log(`   - Flag encrypted with AES-256: ${encryptedFlag.substring(0, 20)}...\n`);
        
        const configContent = `const CONFIG = {
    words: ${JSON.stringify(allWords, null, 4)},
    
    answerLength: ${correctWords.length},
    
    correctAnswerHash: '${correctAnswerHash}',
    
    encryptedFlag: '${encryptedFlag}'
};

Object.freeze(CONFIG);
`;
        
        const configPath = path.join(__dirname, 'config.js');
        fs.writeFileSync(configPath, configContent);
        
        console.log('✅ config.js generated successfully!\n');
        console.log('🚀 You can now open index.html in a browser or deploy to GitHub Pages');
        console.log('⚠️  Remember to add .env to .gitignore before committing!\n');
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

build();
