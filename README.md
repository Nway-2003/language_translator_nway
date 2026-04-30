Self-Hosted Language Translator
A private and secure web-based translation application. This project features a custom frontend interface that connects to a self-hosted LibreTranslate API, allowing for translation across 42 languages without any external data tracking.

🚀 Features
Total Privacy: All translations happen locally on your machine.

42 Languages Supported: Configured for English, Thai, Chinese, and many more.

Modern UI: Includes a responsive design with a dark mode toggle.

🛠 Prerequisites
Docker Desktop: Installed and running on your machine. (https://www.docker.com/products/docker-desktop/)

Hardware: 16GB RAM is recommended for optimal performance.

📦 Step-by-Step Installation
1. Deploy the Translation Engine
Open your terminal and run the following command to start the LibreTranslate container on port 5001. This will automatically load the 42 supported languages:

Bash
docker run -d -p 5001:5000 --name libretranslate libretranslate/libretranslate --load-only en,zh,ja,th,es,fr,de,hi,bn,ms,tl,ko,it,pt,ru,ar,vi,id,pl,nl,tr,el,he,sv,da,fi,cs,sk,hu,ro,bg,uk,et,lv,lt,fa,ur,sq,az,eo,ga,ky
2. Verify the Container
Ensure the container is running correctly by checking Docker Desktop or using these commands:

Bash
# List all running containers
docker ps

# Check logs to ensure models are finished loading
docker logs -f libretranslate

# Start it with:
docker start libretranslate

OR

Ensure the container is running correctly. You can do this via the terminal or the Docker Desktop app:

Using Docker Desktop:
Open the Docker Desktop application and navigate to the Containers tab.
Find the container named libretranslate.
If it's haven't start yet, simply click the Start (Play button) under the Actions column to turn it on.

3. Launch the Application
Once the engine is ready, open your project folder and launch the interface:

Open index.html in your web browser.

Ensure your script.js is configured to send requests to your local API endpoint: http://localhost:5001/translate.

🖥 Project Setup
Backend (Docker)
The backend is managed via Docker Desktop, ensuring a consistent environment for the translation models.

Frontend (Source Code)
The frontend consists of a clean, structured codebase including HTML, CSS, and JavaScript.

📝 Tech Stack
Frontend: HTML, CSS, JavaScript (Fetch API).

Backend: LibreTranslate (Self-hosted via Docker).

Languages: 42 Pre-loaded models.
