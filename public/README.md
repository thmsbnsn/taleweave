# Public Assets Directory

## Required Files

Copy the following files from the `Branding/` folder to this `public/` directory:

1. `tw-logo.ico` → `public/tw-logo.ico`
2. `twlogo-full.svg` → `public/twlogo-full.svg`

### Windows PowerShell
```powershell
Copy-Item -Path "..\Branding\tw-logo.ico" -Destination "tw-logo.ico"
Copy-Item -Path "..\Branding\twlogo-full.svg" -Destination "twlogo-full.svg"
```

### macOS/Linux
```bash
cp ../Branding/tw-logo.ico .
cp ../Branding/twlogo-full.svg .
```

These files are referenced in the application code and must be in the `public/` folder for Next.js to serve them correctly.

