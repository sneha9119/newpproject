#!/bin/bash

echo "Starting SkillSwap Deployment..."

# Build and start the Docker containers in detached mode
docker-compose up -d --build

echo "Deployment complete! Your application is running at:"
echo "- Frontend: http://localhost:5173"
echo "- Backend: http://localhost:8000"
echo ""
echo "To stop the application, run: docker-compose down" 