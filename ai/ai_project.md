🚀 YouTube Video Downloader Backend – Project Specification

🛠 Technology Stack
	•	Backend: Python with FastAPI
	•	Media Processing Libraries:
	•	yt-dlp (for fetching YouTube video/audio streams)
	•	FFmpeg (for merging audio and video streams into a single file)
	•	Deployment: Docker container (on Oracle Cloud Free Tier)

⸻

📌 Functional Requirements

1. User Flow:
	•	Users anonymously enter a YouTube video URL.
	•	Backend fetches and displays available video quality options (360p, 720p, 1080p max).
	•	Users select their desired quality to download video, or choose to download audio-only (highest quality by default).
	•	Backend downloads selected streams (video/audio) using yt-dlp, processes them with FFmpeg, and provides a downloadable link.

2. File Management:
	•	Downloaded files are stored temporarily on the server for a maximum of 5 minutes.
	•	All generated download links are also valid for a maximum of 5 minutes.

⸻

🌐 API Design
	•	RESTful API architecture returning responses in JSON format.
	•	Clearly defined endpoints to:
	•	Submit YouTube URL and fetch available video quality options.
	•	Initiate downloads based on user’s selected quality.
	•	Provide download URLs that expire after 5 minutes.

⸻

🚧 Restrictions and Limits
	•	Currently, no IP-based download limits or other quotas applied.
	•	Future implementation of IP-based or daily limits can be considered if required.

⸻

🛡 Security & Legal Considerations
	•	A clear, concise disclaimer informing users that they are responsible for content they download.
	•	No content permanently stored on server beyond the 5-minute temporary period.
	•	The system takes basic measures to avoid getting blocked by YouTube (appropriate headers, use of yt-dlp’s built-in signature deciphering, and handling of known security parameters).

⸻

📈 Analytics and Logging
	•	No analytics or logging infrastructure implemented at this stage. (Potential future feature.)

⸻

🐳 Deployment
	•	The application will initially be developed and tested without Docker.
	•	Dockerization and deployment to Oracle Cloud Free Tier will be handled after successful development and initial testing.

⸻

🗒 Future Considerations
	•	Possibility of integrating a frontend (React, Vue, etc.) in the future.
	•	REST API design ensures easy frontend integration.
