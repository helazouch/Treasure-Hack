# 🏴‍☠️ Treasure Hunt Word Puzzle Game

A secure drag-and-drop word puzzle game designed for treasure hunts. Players must arrange scrambled words in the correct order to reveal a hidden flag!

## ✨ Features

- 🎯 **Drag-and-Drop Interface** - Intuitive word arrangement
- 🔒 **Secure Flag Storage** - Answer hashed with SHA-256, flag encrypted with AES-256
- 🎨 **Beautiful UI** - Modern, responsive design
- 🚀 **Easy Deployment** - Host on GitHub Pages with one click
- ⚙️ **Configurable** - Easy to customize words and flags via .env file

## 🔐 Security Features

1. **SHA-256 Hashing** - The correct answer is hashed before deployment, so the actual answer is never in the source code
2. **AES-256 Encryption** - The flag is encrypted using the correct answer as the key, making it truly irreversible without the answer
3. **Environment Variables** - Sensitive data stored in .env file (never committed to GitHub)
4. **.gitignore Protection** - Automatically prevents .env from being committed

⚠️ **Note**: This is client-side security (obfuscation). Determined users can still extract the flag from the JavaScript. For true CTF-level security, use server-side validation.

## 📋 Prerequisites

- Node.js installed (for building the config file)
- A text editor
- A web browser

## 🚀 Quick Start

### 1. Configure Your Puzzle

Edit the `.env` file with your puzzle configuration:

```env
# The correct answer (words separated by spaces in the correct order)
CORRECT_ANSWER=the quick brown fox

# The flag that will be revealed when the puzzle is solved
FLAG=FLAG{you_found_the_treasure_2026}

# Words to display (comma-separated)
WORDS=the,quick,brown,fox
```

**Important**: Make sure the words in `WORDS` match the words in `CORRECT_ANSWER`!

### 2. Build the Configuration

Run the build script to generate the secure config file:

```bash
npm run build
```

Or directly:

```bash
node build.js
```

This will:

- Hash your correct answer with SHA-256
- Encrypt your flag with AES-256 using the answer as the key
- Generate `config.js` with the secure data

### 3. Test Locally

Open `index.html` in your web browser to test the game.

### 4. Deploy to GitHub Pages

1. Create a new GitHub repository
2. **IMPORTANT**: Make sure `.env` is in `.gitignore` (it already is!)
3. Add all files to git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. Push to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```
5. Enable GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "main" branch as source
   - Click "Save"
6. Your game will be live at: `https://yourusername.github.io/your-repo-name/`

## 📁 Project Structure

```
treasure-hunt/
├── index.html          # Main HTML file
├── style.css           # Styling and animations
├── app.js              # Game logic and drag-and-drop functionality
├── config.js           # Generated config (hashed answer & encoded flag)
├── build.js            # Build script to generate config.js
├── .env                # Your secret configuration (DO NOT COMMIT!)
├── .env.example        # Example configuration file
├── .gitignore          # Prevents .env from being committed
├── package.json        # NPM configuration
└── README.md           # This file
```

## 🎮 How to Play

1. Drag words from the "Word Bank" to the "Arrange Words Here" area
2. Place words in the correct order
3. Click "Submit Answer" to check your solution
4. If correct, the flag will be revealed! 🎉
5. Click "Reset" to start over

## 🛠️ Customization

### Change the Words and Answer

Edit `.env`:

```env
CORRECT_ANSWER=new word order here
WORDS=new,word,order,here
```

Then rebuild:

```bash
npm run build
```

### Change the Colors

Edit `style.css` and modify the gradient colors:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add More Words

Simply add more words to the `WORDS` field in `.env` (comma-separated), and include them in the `CORRECT_ANSWER`.

## 🔒 Security Best Practices

1. ✅ **Never commit .env** - Already in .gitignore
2. ✅ **Always rebuild after changes** - Run `npm run build` after editing .env
3. ✅ **Use strong flags** - Make them hard to guess
4. ⚠️ **Client-side limitation** - Remember, client-side code can be inspected
5. 💡 **For production CTFs** - Consider server-side validation for true security

## 🐛 Troubleshooting

**Problem**: Config.js not found

- **Solution**: Run `npm run build` to generate it from .env

**Problem**: Words don't match answer

- **Solution**: Ensure WORDS in .env contains exactly the same words as CORRECT_ANSWER

**Problem**: Flag not showing

- **Solution**: Check that your answer exactly matches CORRECT_ANSWER (case-sensitive, spaces matter)

**Problem**: .env committed to GitHub

- **Solution**: If accidentally committed, remove from git history:
  ```bash
  git rm --cached .env
  git commit -m "Remove .env from tracking"
  ```

## 📝 License

MIT License - Feel free to use this for your treasure hunts!

## 🎉 Credits

Created for treasure hunt challenges and CTF events.

---

**Happy Treasure Hunting! 🗺️✨**
