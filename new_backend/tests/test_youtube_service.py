import os
import pytest
from unittest.mock import patch, MagicMock

from app.services.youtube_service import YouTubeService


class TestYouTubeService:
    """Tests for the YouTube service"""
    
    def test_validate_youtube_url(self):
        """Test URL validation function"""
        # Valid URLs
        assert YouTubeService.validate_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        assert YouTubeService.validate_youtube_url("https://youtu.be/dQw4w9WgXcQ")
        assert YouTubeService.validate_youtube_url("http://youtube.com/watch?v=dQw4w9WgXcQ")
        
        # Invalid URLs
        assert not YouTubeService.validate_youtube_url("https://www.google.com")
        assert not YouTubeService.validate_youtube_url("https://www.youtube.com")
        assert not YouTubeService.validate_youtube_url("")
    
    def test_get_yt_dlp_options(self):
        """Test default yt-dlp options"""
        options = YouTubeService._get_yt_dlp_options()
        
        # Verify basic options
        assert options['quiet'] is True
        assert options['no_warnings'] is True
        assert 'http_headers' in options
        
        # Test merging with custom options
        custom_options = {'format': 'bestvideo', 'quiet': False}
        merged_options = YouTubeService._get_yt_dlp_options(custom_options)
        
        assert merged_options['format'] == 'bestvideo'
        assert merged_options['quiet'] is False  # Should override default
    
    @patch('yt_dlp.YoutubeDL')
    @pytest.mark.asyncio
    async def test_get_video_info(self, mock_youtube_dl):
        """Test video info extraction"""
        # Mock YoutubeDL extract_info method
        mock_instance = MagicMock()
        mock_youtube_dl.return_value.__enter__.return_value = mock_instance
        
        # Setup mock response data
        mock_info = {
            'id': 'test_video_id',
            'title': 'Test Video',
            'thumbnail': 'http://example.com/thumbnail.jpg',
            'duration': 120,
            'uploader': 'Test Channel',
            'formats': [
                {
                    'format_id': '22',
                    'height': 720,
                    'fps': 30,
                    'filesize': 10000000,
                    'ext': 'mp4',
                    'vcodec': 'avc1.64001F',
                    'acodec': 'mp4a.40.2'
                },
                {
                    'format_id': '18',
                    'height': 360,
                    'fps': 30,
                    'filesize': 5000000,
                    'ext': 'mp4',
                    'vcodec': 'avc1.42001E',
                    'acodec': 'mp4a.40.2'
                },
                {
                    'format_id': '140',
                    'height': None,
                    'fps': None,
                    'filesize': 2000000,
                    'ext': 'm4a',
                    'vcodec': 'none',
                    'acodec': 'mp4a.40.2'
                }
            ]
        }
        
        mock_instance.extract_info.return_value = mock_info
        
        # Call the method
        result = await YouTubeService.get_video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        
        # Assertions
        assert result['id'] == 'test_video_id'
        assert result['title'] == 'Test Video'
        assert len(result['formats']) == 2  # Should filter out audio-only format
        assert result['has_audio_only'] is True
        
        # Validate format filtering and ordering
        assert result['formats'][0]['resolution'] == '720p'
        assert result['formats'][1]['resolution'] == '360p' 