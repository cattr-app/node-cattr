# node-cattr

[![node](https://img.shields.io/node/v/@amazingcat/node-cattr.svg)](https://www.npmjs.com/package/@amazingcat/node-cattr)
[![npm](https://img.shields.io/badge/npm-9.9.4-blue.svg)](https://www.npmjs.com/package/@amazingcat/node-cattr)
[![license](https://img.shields.io/npm/l/@amazingcat/node-cattr.svg)](LICENSE)

The public Node.js SDK for the [Cattr time-tracking platform](https://github.com/cattr-app/server-application). It provides authentication, automatic token renewal, project and task access, time reporting, interval and screenshot submission, activity monitoring, and instance metadata through one CommonJS client.

## Requirements

- Node.js 24.21.x (the version declared by the package)
- A reachable Cattr server
- A Cattr user account for authenticated operations

## Installation

```bash
npm install @amazingcat/node-cattr
```

## Quick start

```js
const Cattr = require('@amazingcat/node-cattr');

const cattr = new Cattr();

// Providers let the application decide where credentials and tokens are stored.
const credentials = {
  value: {
    email: process.env.CATTR_EMAIL,
    password: process.env.CATTR_PASSWORD,
  },
  async get() {
    return this.value;
  },
  async set(value) {
    this.value = value;
  },
};

const tokens = {
  value: null,
  async get() {
    return this.value;
  },
  async set(token, tokenType, tokenExpire) {
    this.value = { token, tokenType, tokenExpire };
  },
};

cattr.credentialsProvider = credentials;
cattr.tokenProvider = tokens;

async function main() {
  // Accepts a Cattr host or API URL and detects the /api/ endpoint.
  await cattr.setBaseUrl('https://cattr.example.com/');

  const login = await cattr.authentication.login(
    process.env.CATTR_EMAIL,
    process.env.CATTR_PASSWORD,
  );
  await tokens.set(
    login.token.token,
    login.token.tokenType,
    login.token.tokenExpire,
  );

  const me = await cattr.authentication.me();
  const projects = await cattr.projects.list();

  console.log(`Signed in as ${me.fullName}`);
  console.log(projects);
}

main().catch(console.error);
```

Do not hard-code credentials in source code. The in-memory providers above are intentionally minimal; production applications should use an appropriate secure store.

## Client setup

### Base URL

```js
await cattr.setBaseUrl('cattr.example.com');
console.log(cattr.baseUrl);
```

`setBaseUrl(url)` checks the server's status endpoint. If Cattr is not served at the supplied root, the SDK also tries the `/api/` path. `ping()` and `isCattrInstance()` can be used for later availability checks.

### Credential and token providers

Both providers must be objects with asynchronous or synchronous `get` and `set` methods:

```js
cattr.credentialsProvider = {
  get: async () => ({ email, password }),
  set: async value => saveCredentials(value),
};

cattr.tokenProvider = {
  get: async () => loadToken(), // { token, tokenType, tokenExpire }
  set: async (token, tokenType, tokenExpire) => {
    await saveToken({ token, tokenType, tokenExpire });
  },
};
```

Authenticated requests read the current token from `tokenProvider`. If it is missing or the server reports an expired/unauthorized token, the SDK uses `credentialsProvider` to log in again, saves the new token, and retries the request once.

### Axios configuration

The SDK creates its own Axios instance. Assigning a property recreates that instance with the accumulated configuration:

```js
cattr.axiosConfiguration.timeout = 10_000;
cattr.axiosConfiguration.headers = {
  'User-Agent': 'my-cattr-integration/1.0',
};
```

Set the base URL with `setBaseUrl()` rather than assigning `axiosConfiguration.baseURL` directly when endpoint detection is desired.

## API reference

All resource methods are asynchronous.

### Client

| Method/property | Description |
| --- | --- |
| `credentialsProvider = provider` | Set the credentials storage provider. |
| `tokenProvider = provider` | Set the token storage provider. |
| `setBaseUrl(url, force?)` | Detect and configure the Cattr API base URL. |
| `baseUrl` | Return the configured base URL. |
| `ping()` | Check whether the configured endpoint is a Cattr instance. |
| `isCattrInstance()` | Check the public status response for a Cattr marker. |
| `reloginAutomatically()` | Attempt login with credentials from the provider and persist the returned token. |
| `get(url, options?)` | Perform a low-level GET request. |
| `post(url, body, options?)` | Perform a low-level POST request. |
| `put(url, body, options?)` | Perform a low-level PUT request. |
| `patch(url, body, options?)` | Perform a low-level PATCH request. |

Low-level request options include `headers`, `noAuth`, `noRelogin`, `noPaginate`, and `asFormData`. Prefer the resource methods below unless an endpoint is not yet represented by the SDK.

### Authentication

Available through `cattr.authentication`.

| Method | Returns | Description |
| --- | --- | --- |
| `login(email, password)` | `{ token, user }` | Authenticate with email and password. This method does not save the token automatically. |
| `me()` | user object | Fetch and normalize the current user. |
| `logout(fromAll = false)` | `true` | Log out from the current session or all sessions. |
| `refresh(relogin = false)` | token object | Refresh the access token. This method does not save the returned token automatically. |
| `getSingleClickRedirection()` | URL string | Obtain an app-to-web single-click sign-in URL. |
| `authenticateViaSSO(token)` | `{ token, user }` | Exchange a desktop SSO token for a normal session. |

### Projects and tasks

```js
const projects = await cattr.projects.list({});
const tasks = await cattr.tasks.list({ project_id: projects[0].id });

const createdTask = await cattr.tasks.create({
  project_id: projects[0].id,
  task_name: 'Prepare release notes',
});
```

Filtering and creation objects are forwarded to the corresponding Cattr API endpoint. Refer to the [Cattr server project](https://github.com/cattr-app/server-application) for fields supported by your server version.

| Resource | Method | Description |
| --- | --- | --- |
| `projects` | `list(options?)` | List projects without pagination. Returned records normalize dates and common fields. |
| `tasks` | `list(options?)` | List tasks without pagination. |
| `tasks` | `create(options)` | Create a task. |

### Time reports

```js
const total = await cattr.time.getTotal({
  start_at: '2026-01-01T00:00:00.000Z',
  end_at: '2026-01-31T23:59:59.999Z',
});

const perTask = await cattr.time.getPerTasks({
  start_at: '2026-01-01T00:00:00.000Z',
  end_at: '2026-01-31T23:59:59.999Z',
});
```

| Method | Description |
| --- | --- |
| `time.getTotal(options?)` | Return the total tracked time and selected period. |
| `time.getPerTasks(options?)` | Return tracked time grouped by task. |

### Time intervals and activity

```js
const interval = {
  taskId: 42,
  userId: 7,
  start: new Date('2026-01-20T09:00:00Z'),
  end: new Date('2026-01-20T09:10:00Z'),
  systemActivity: 80,
  mouseActivity: 55,
  keyboardActivity: 40,
};

await cattr.intervals.create(interval);
await cattr.intervals.createWithScreenshot(interval, screenshotBuffer);
await cattr.intervals.remove(123);

await cattr.intervals.pushActiveApplicationUpdate({
  executable: '/usr/bin/code',
  title: 'README.md — node-cattr',
  url: 'https://github.com/cattr-app/node-cattr',
});
```

`start` and `end` must be `Date` objects. Screenshots must be Node.js `Buffer` instances containing JPG or PNG data.

### Screenshots

```js
const screenshot = await cattr.screenshots.upload(
  intervalId,
  screenshotBuffer,
);
```

`screenshots.upload(intervalId, buffer)` uploads a screenshot for an existing interval and returns normalized screenshot metadata.

### Company and instance information

| Method | Description |
| --- | --- |
| `company.heartbeatInterval()` | Return the configured heartbeat period in seconds, or `null` for an unexpected response. |
| `company.heartBeat()` | Notify the server that the current user is active. |
| `company.about()` | Return application and instance metadata, or `null` for an unexpected response. |

### Offline synchronization

```js
const publicKey = await cattr.offlineSync.getPublicKey();
```

`offlineSync.getPublicKey()` returns the server's RSA public key for offline interval synchronization.

## Error handling

Resource methods throw specialized errors exposed on each client instance:

```js
try {
  await cattr.projects.list();
} catch (error) {
  if (error instanceof cattr.NetworkError) {
    console.error('The Cattr server could not be reached', error.context);
  } else if (error instanceof cattr.ApiError) {
    console.error(
      `Cattr API error ${error.statusCode}: ${error.code}`,
      error.message,
      error.trace_id,
    );
  } else {
    throw error;
  }
}
```

- `ApiError` represents an HTTP error returned by Cattr and carries `statusCode`, `code`, `message`, `trace_id`, and request `context` when available.
- `NetworkError` represents a request that did not receive an HTTP response and carries the original request data and `context`.
- `CredentialsError` represents a local authentication failure in a low-level request result, such as a missing token with unsuccessful automatic login. Resource methods surface the failure as an `ApiError`.
- Invalid method arguments throw `TypeError`.

Low-level `get`, `post`, `put`, and `patch` calls return a result envelope (`{ success, response }` on success or `{ success: false, ... }` on failure). Resource methods convert unsuccessful envelopes into exceptions.

## Development

```bash
git clone https://github.com/cattr-app/node-cattr.git
cd node-cattr
npm install
npm run lint
```

When contributing a new endpoint, keep transport concerns in the base client and expose domain behavior through a resource under `src/resources/`.

Issues and feature requests are tracked in the [GitHub issue tracker](https://github.com/cattr-app/node-cattr/issues).

## Related project

- [Cattr server application](https://github.com/cattr-app/server-application)

## License

[MIT](LICENSE) © 2020 amazingcat LLC
