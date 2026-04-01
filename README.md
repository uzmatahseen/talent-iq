# talent-iq

This project includes a backend server that uses the Piston code execution API to compile and run user-submitted code.

## Piston API Changes (Feb 2026)

The public Piston endpoint at `https://emkc.org/api/v2/piston/execute` became whitelist-only as of February 15, 2026. Requests from unapproved clients now receive a 401 response with a message like:

```
{"message":"Public Piston API is now whitelist only as of 2/15/2026. Please contact EngineerMan on Discord with use case justification or consider hosting your own Piston instance."}
```

### What you need to do

1. **Request whitelist access** from the Piston maintainers (EngineerMan on Discord) and set `PISTON_API_URL`/`PISTON_API_KEY` accordingly if granted.
2. **Host your own Piston instance** and configure the backend to point at it using `PISTON_API_URL` environment variable. The code will automatically include an optional `PISTON_API_KEY` in the `Authorization` header if provided.
3. If you continue using the public endpoint without being whitelisted, the code will log a 401 and return a 501/401 error to clients.

### Environment variables

- `PISTON_API_URL` – override the default endpoint. Example: `http://localhost:8000/api/v2/piston/execute`.
- `PISTON_API_KEY` – optional bearer token for private or whitelisted endpoints.

Set these values in the backend `.env` file or your deployment environment.

```env
PISTON_API_URL=https://emkc.org/api/v2/piston/execute
PISTON_API_KEY=your_key_here
```

Feel free to extend this README with other project details.