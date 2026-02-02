# Project Context

## Project Name
Discord Multi-Command Bot

## Purpose
A Discord bot built with Node.js designed to handle moderation, utilities, roles, messages, and setup automation.

## Core Goals
- Fast startup (no command sync on runtime)
- Stable slash-command execution
- Modular command architecture
- Safe error handling (no crashes)
- Easy command expansion

## Non-Goals
- No runtime command deployment
- No UI/dashboard
- No database-heavy analytics

## Tech Stack
- Node.js
- discord.js (v14)
- SQLite (optional)
- dotenv
- Modular command loader

## Runtime Environment
- Local development via VS Code
- Deployment via VPS / Railway / Heroku-like platforms

## Critical Constraint
⚠️ Slash commands MUST NOT be synced on every restart.
Command deployment is handled manually via deploy script.

If an AI suggests syncing commands inside bot.js on startup, it is WRONG.
