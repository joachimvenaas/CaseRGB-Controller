# CaseRGB-Controller
Node script that dims the case RGB when computer locks and dims back up when unlocked

# Usage
Use in combination with task scheduler in Windows, create a event for lock and unlock
- Lock: rgb.bat -stop
- Unlock: rgb.bat -start

# Installation
- npm install openrgb
- OpenRGB must be installed and running
