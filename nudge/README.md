# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Backend API (this app)

All requests use a single origin from `REACT_APP_API_BASE_URL` (see `src/api/apiConfig.js`). No trailing slash; paths are joined as `` `${API_BASE_URL}/...` ``.

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/tasks/enrich` | Normalize “what I did today” → task fields (OpenAI on server). |
| `POST` | `/api/suggestions` | Next-task suggestion + rationale. |
| `POST` | `/tasks/` | Save enriched task + `user_id` (after enrich). |
| `POST` | `/users/` | Create user; body `{ "username": "..." }`. Response same shape as GET user (e.g. `user_id`, `person_tasks`). **409** if username taken. |
| `GET` | `/user_by_username/:name` | Load user + task list. **404** if user does not exist. |
| `GET` | `/user_by_id/:id` | Load user + task list. **404** if id invalid / user removed. |

Client sends `Content-Type: application/json` only — no OpenAI key in the browser.

## Environment variables

1. Copy the example file and edit locally (file is gitignored):

   ```bash
   cd nudge
   cp .env.example .env.local
   ```

2. **Local full stack:** run your API on `PORT` (e.g. `8000`) with `HOST=0.0.0.0`, and set:

   `REACT_APP_API_BASE_URL=http://127.0.0.1:8000`

   The React dev server (`npm start`) uses `HOST` / `PORT` in `.env.local` for where the **frontend** listens (default in example: `0.0.0.0:3000`). The **backend** port is separate.

3. **Production:** set `REACT_APP_API_BASE_URL` in your build environment (e.g. Koyeb). `npm run build` does not use `.env.local` — only `.env.production` / `.env.production.local` and host-provided env.

Backend-only template (separate repo): see `docs/backend.env.example` in the repo root.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
With `.env.local` from `.env.example`, open [http://localhost:3000](http://localhost:3000) (or your chosen `PORT`) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
