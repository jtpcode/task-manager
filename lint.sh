#!/bin/bash
set -e

echo "=== Backend: Type Checking ==="
cd backend
npm run tsc

echo "=== Backend: Linting ==="
npm run lint

cd ../frontend

echo "=== Frontend: Type Checking ==="
npm run tsc

echo "=== Frontend: Linting ==="
npm run lint

cd ..
echo "=== All checks completed successfully ==="