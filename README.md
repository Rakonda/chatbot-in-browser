# AI Assistant Chatbot in Browser

A web-based AI chatbot built with Vue 3, TypeScript, and Vite. The app leverages modern front-end tech (Pinia, Vue Router, TailwindCSS) and integrates @huggingface/transformers for running AI models directly in your browser using Web Workers.

## Features

- **Conversational AI chatbot** web app running fully in the browser
- **Vue 3 + Vite** rapid-setup and hot-reloading
- **TypeScript** for type safety
- **State management** with Pinia
- **Vue Router** for SPA navigation
- **Chat UI** with animated thinking/progress states
- **In-browser inference** via worker threads (no backend server needed)
- **Tailwind CSS** and FontAwesome for styling
- **Easy start, build, and type/lint formatting scripts**

## Getting Started

### Prerequisites
- Node.js v20+ ([check your version](https://nodejs.org/en))
- npm v8+

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production
```bash
npm run build
```

### Lint & Format
```bash
npm run lint   # Fixes linting errors automatically
npm run format # Formats your code with Prettier
```

## Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── assets/             # Static and global CSS
│   ├── components/         # Vue components
│   ├── views/              # Main views/pages
│   ├── router/             # Vue Router setup
│   ├── stores/             # Pinia stores
│   ├── workers/            # Web Worker code (AI model inference)
│   ├── App.vue             # App root component
│   └── main.ts             # App entrypoint
├── index.html              # App HTML template
├── package.json            # Project config & dependencies
├── vite.config.ts          # Vite config
└── ...
```

## Tech Stack
- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [HuggingFace/Xenova Transformers](https://github.com/xenova/transformers.js) in-browser
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Worker)

## License

[MIT](./LICENSE)
