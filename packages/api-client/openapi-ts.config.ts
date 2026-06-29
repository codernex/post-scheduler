import {defineConfig} from '@hey-api/openapi-ts';

// @ts-ignore
export default defineConfig({
    client: '@hey-api/client-fetch',
    // Assuming your FastAPI server runs on port 8000 locally
    input: 'http://localhost:8081/openapi.json',
    output: 'src/client',
});