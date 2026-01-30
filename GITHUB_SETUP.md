# How to Upload Your JavaScript Bot to GitHub

## Step 1: Create a New GitHub Repository

1. Go to [https://github.com](https://github.com)
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Fill in:
   - **Repository name:** `discord-bot-js` (or any name you want)
   - **Description:** "Discord moderation and music bot built with Discord.js"
   - **Public or Private:** Choose based on preference
   - ⚠️ **DO NOT** check "Add a README file"
   - ⚠️ **DO NOT** check "Add .gitignore"
   - ⚠️ **DO NOT** choose a license yet
5. Click **"Create repository"**

## Step 2: Initialize Git in Your Project

Open PowerShell in your bot folder and run these commands:

```powershell
# Navigate to your bot folder (if not already there)
cd D:\bot

# Initialize git repository
git init

# Add all files (but .gitignore will exclude sensitive ones)
git add .

# Create your first commit
git commit -m "Initial commit: JavaScript Discord bot with 41 commands"
```

## Step 3: Connect to GitHub

After creating the repository on GitHub, you'll see instructions. Use these commands:

```powershell
# Add your GitHub repository as remote
# Replace YOUR-USERNAME and YOUR-REPO-NAME with your actual GitHub info
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Example:
If your GitHub username is `john123` and repo name is `discord-bot-js`:
```powershell
git remote add origin https://github.com/john123/discord-bot-js.git
git branch -M main
git push -u origin main
```

## Step 4: Enter Your Credentials

When prompted:
- **Username:** Your GitHub username
- **Password:** Your GitHub Personal Access Token (NOT your password)

### How to Create Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Bot Repository Access"
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Step 5: Verify Upload

1. Go to your GitHub repository URL
2. Refresh the page
3. You should see all your files!

## Alternative: Using GitHub Desktop

If you prefer a GUI:

1. Download [GitHub Desktop](https://desktop.github.com/)
2. Install and sign in
3. Click "Add" → "Add Existing Repository"
4. Choose `D:\bot` folder
5. Click "Publish repository"
6. Choose name and visibility
7. Click "Publish"

## Future Updates

After making changes to your bot:

```powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Added new features"

# Push to GitHub
git push
```

## Common Issues

### "git is not recognized"
Install Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)

### "Permission denied"
- Check your personal access token
- Make sure you have write access to the repository

### "Repository not found"
- Double-check the repository URL
- Verify you spelled username and repo name correctly

## What's Being Uploaded

✅ Your code files (commands, utils, database)
✅ Documentation (README, guides)
✅ Configuration templates
✅ Package.json (dependencies)

❌ NOT uploaded (protected by .gitignore):
- `.env` file (contains your bot token)
- `node_modules/` (dependencies - too large)
- `bot_data.db` (database - contains user data)
- Log files
- Python virtual environment

## Security Notes

⚠️ **NEVER commit:**
- Your `.env` file with bot token
- Database files with user data
- Any files with passwords or API keys

The `.gitignore` file I created protects you from accidentally uploading these!

## Need Help?

- [GitHub Guides](https://guides.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Discord.js Guide](https://discordjs.guide/)
