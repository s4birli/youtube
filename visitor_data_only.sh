#!/bin/bash
set -e

echo "🧹 Removing existing cookies file to prevent format errors..."
rm -f youtube_cookies.txt

echo "📝 Creating a simple config file with visitor data approach..."

cat > new_backend/visitor_data_config.py << 'EOF'
"""
Custom configuration for visitor data approach
"""

# Force using visitor data instead of cookies
USE_VISITOR_DATA = True

# Generic visitor data (may need to be refreshed occasionally)
VISITOR_DATA = "CgtTSzFGVndwTjJvayiO6LCcBg%3D%3D"

# Extractor args for yt-dlp
EXTRACTOR_ARGS = {
    'youtubetab': {'skip': ['webpage']},
    'youtube': {
        'player_skip': ['webpage', 'configs'],
        'visitor_data': [VISITOR_DATA]
    }
}
EOF

echo "🔄 Updating YouTube service to use visitor data only..."

cat > new_backend/app/services/youtube_data.py << 'EOF'
"""
Simple module to provide visitor data configuration
"""
try:
    # Try to import custom config
    from visitor_data_config import USE_VISITOR_DATA, VISITOR_DATA, EXTRACTOR_ARGS
except ImportError:
    # Default values if config is not found
    USE_VISITOR_DATA = True
    VISITOR_DATA = "CgtTSzFGVndwTjJvayiO6LCcBg%3D%3D"
    EXTRACTOR_ARGS = {
        'youtubetab': {'skip': ['webpage']},
        'youtube': {
            'player_skip': ['webpage', 'configs'],
            'visitor_data': [VISITOR_DATA]
        }
    }
EOF

# Create a patch for the YouTube service
cat > youtube_service_patch.py << 'EOF'
"""
Simple replacement for _get_yt_dlp_options method in youtube_service.py
"""

# Copy this code to youtube_service.py in the _get_yt_dlp_options method

@staticmethod
def _get_yt_dlp_options(options: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Get default yt-dlp options with any additional options merged
    
    Args:
        options: Additional options to merge with defaults
        
    Returns:
        Dict of yt-dlp options
    """
    # Import visitor data configuration
    try:
        from app.services.youtube_data import USE_VISITOR_DATA, VISITOR_DATA, EXTRACTOR_ARGS
        logger.info("Using visitor data configuration")
    except ImportError:
        # Default values if module is not found
        logger.warning("youtube_data.py not found, using hard-coded visitor data")
        USE_VISITOR_DATA = True
        VISITOR_DATA = "CgtTSzFGVndwTjJvayiO6LCcBg%3D%3D"
        EXTRACTOR_ARGS = {
            'youtubetab': {'skip': ['webpage']},
            'youtube': {
                'player_skip': ['webpage', 'configs'],
                'visitor_data': [VISITOR_DATA]
            }
        }
    
    # Default options to avoid throttling and mimic browser behavior
    default_options = {
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
    }
    
    # Force visitor data approach (no cookies)
    logger.info("Using visitor data approach (no cookies)")
    default_options['extractor_args'] = EXTRACTOR_ARGS
    
    # Add browser-like headers to avoid detection
    default_options['http_headers'] = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
    }
    
    # Merge with provided options
    if options:
        # Special handling for extractor_args to merge them properly
        if 'extractor_args' in options and 'extractor_args' in default_options:
            for extractor, args in options['extractor_args'].items():
                if extractor in default_options['extractor_args']:
                    default_options['extractor_args'][extractor].update(args)
                else:
                    default_options['extractor_args'][extractor] = args
            del options['extractor_args']
        
        default_options.update(options)
        
    return default_options
EOF

echo "❗ Please replace the _get_yt_dlp_options method in new_backend/app/services/youtube_service.py with the code from youtube_service_patch.py"
echo "📋 Copy and paste the code manually into your editor"

echo "🔄 Then rebuild the container with:"
echo "./rebuild_container.sh" 