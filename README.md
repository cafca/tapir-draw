# beep-boop

TLDraw demo with [p2panda](https://github.com/p2panda/handbook) as a backend.

## Requirements

* Node.js
* Rust

## Development

```bash
# Install Node dependencies
npm install

# Run development server (via http://localhost:4000)
npm run start

# Start native application in development mode (make sure the development
# server runs simultaneously)
npm run tauri:start

# Check linter errors
npm run lint

# Build static files for web hosting
npm run build

# Build native desktop application
npm run tauri:build
```

## License

[`MIT`](LICENSE)
