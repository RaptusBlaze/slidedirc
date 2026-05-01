## Node 22 upgrade notes

- Docker builder image was bumped to `node:22-alpine` to match the CI runtime.
- GitHub Actions `setup-node` was bumped to Node 22 so CI and container builds stay aligned.
- For Vite 7, Node 22 is a safe LTS target and avoids the Node 20.19 minimum edge.
