import { useState, useEffect } from 'react';
import { VideoFormat } from '../../types/video.types';

interface FormatSelectorProps {
    formats: VideoFormat[];
    onFormatSelect: (format: VideoFormat) => void;
    selectedFormat: VideoFormat | null;
}

const FormatSelector = ({ formats, onFormatSelect, selectedFormat }: FormatSelectorProps) => {
    const [selectedFormatId, setSelectedFormatId] = useState<string>('');

    // Update local state when selectedFormat changes from parent
    useEffect(() => {
        if (selectedFormat) {
            setSelectedFormatId(selectedFormat.format_id);
        }
    }, [selectedFormat]);

    const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const formatId = e.target.value;
        setSelectedFormatId(formatId);

        // Find the selected format object from the formats array
        const format = formats.find(f => f.format_id === formatId);
        if (format) {
            onFormatSelect(format);
        }
    };

    if (!formats || formats.length === 0) {
        return null;
    }

    // Sort formats by quality/resolution
    const sortedFormats = [...formats].sort((a, b) => {
        // Sort by resolution
        const resA = a.resolution ? parseInt(a.resolution.replace('p', '')) : 0;
        const resB = b.resolution ? parseInt(b.resolution.replace('p', '')) : 0;
        return resB - resA;
    });

    return (
        <div className="w-full">
            <h3 className="text-lg font-bold mb-4">Available Formats</h3>

            <div className="mb-4">
                <label htmlFor="format" className="block text-gray-700 text-sm font-medium mb-2">
                    Select Format
                </label>
                <select
                    id="format"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedFormatId}
                    onChange={handleFormatChange}
                    required
                >
                    <option value="">-- Select Format --</option>
                    {sortedFormats.map((format) => (
                        <option key={format.format_id} value={format.format_id}>
                            {format.resolution || 'Audio only'} - {format.ext}
                            {format.filesize && ` (${(format.filesize / 1024 / 1024).toFixed(1)} MB)`}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default FormatSelector; 