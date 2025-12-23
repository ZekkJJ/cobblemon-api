# Sound Files Missing

The frontend expects the following sound files in this directory:

- `click.mp3` - Button click sound
- `confirm.mp3` - Confirmation sound
- `cancel.mp3` - Cancel/back sound
- `error.mp3` - Error sound
- `roll.mp3` - Gacha roll sound

## How to Add Sounds

1. Find free sound effects from sites like:
   - https://freesound.org/
   - https://mixkit.co/free-sound-effects/
   - https://www.zapsplat.com/

2. Download MP3 files and rename them to match the names above

3. Place them in this `frontend/public/sounds/` directory

## Temporary Solution

For now, the app will work without sounds - it just won't play audio effects. The sound errors in the console can be ignored during development.
