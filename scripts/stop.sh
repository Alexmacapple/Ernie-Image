#!/bin/bash
pkill -f "uvicorn server:app" && echo "Ernie Studio arrêté." || echo "Aucun processus trouvé."
