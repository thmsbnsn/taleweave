# Troubleshooting Guide

## Can't Access http://localhost:3000

### Check 1: Is the server running?

Look for output like:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

If not, start it:
```bash
npm run dev
```

### Check 2: Try Alternative URLs

- `http://127.0.0.1:3000`
- `http://localhost:3000`
- Check firewall isn't blocking port 3000

### Check 3: Port Already in Use?

If port 3000 is busy, use a different port:
```bash
npm run dev -- -p 3001
```
Then visit: http://localhost:3001

### Check 4: Build Errors?

Check the terminal output for errors. Common issues:
- Missing environment variables
- TypeScript errors
- Module not found errors

### Check 5: Browser Issues?

- Try a different browser
- Clear browser cache
- Try incognito/private mode
- Disable browser extensions

### Check 6: Environment Variables

Make sure `.env.local` exists and has all required keys:
- Supabase URL and keys
- OpenAI API key
- ElevenLabs API key
- Replicate token
- Stripe keys

### Quick Test

1. Check if server is running:
   ```bash
   netstat -ano | findstr :3000
   ```
   (Should show LISTENING)

2. Try accessing directly:
   ```bash
   curl http://localhost:3000
   ```
   Or in browser: http://localhost:3000

3. Check for errors in terminal where you ran `npm run dev`

## Still Not Working?

Check the terminal output when you run `npm run dev` - it will show specific errors.

Common fixes:
- Run `npm install` again
- Delete `.next` folder and rebuild: `npm run build`
- Check Node.js version (needs 18+): `node --version`

