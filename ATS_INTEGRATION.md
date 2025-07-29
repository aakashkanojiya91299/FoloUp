# ATS System Integration

This document explains how the ATS (Applicant Tracking System) functionality has been integrated into your main application.

## Overview

The ATS system provides AI-powered resume-to-job-description matching functionality. It consists of:

1. **ATS-System Server**: A separate Express.js server that handles document parsing and AI analysis
2. **Frontend Integration**: React components and services that connect to the ATS server
3. **User Interface**: A modern, responsive UI for uploading and analyzing resumes

## Architecture

```
Main Next.js App
├── src/services/atsService.ts     # Service layer for ATS API calls
├── src/components/ATSResumeMatcher.tsx  # React component for UI
└── src/app/ats/page.tsx          # ATS page route

ATS-System Server (Separate)
├── src/server.ts                  # Express server
├── src/routes/match.ts            # API routes for matching
├── src/services/openaiService.ts  # AI integration (Gemini)
└── src/utils/                     # Document parsing utilities
```

## Features

### Resume Matching
- Upload multiple resumes (PDF, DOC, DOCX)
- Upload job descriptions
- AI-powered analysis using Gemini API
- Match scoring (0-100%)
- Missing skills identification
- Detailed feedback

### User Interface
- Drag-and-drop file upload
- Real-time server status monitoring
- Progress indicators
- Error handling
- Responsive design

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# ATS Server URL (defaults to localhost:4000)
ATS_SERVER_URL=http://localhost:4000/api

# Gemini API Key (for AI analysis)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Start the ATS Server

```bash
# Option 1: Use the provided script
./start-ats-server.sh

# Option 2: Manual start
cd ATS-System
npm install
npm start
```

The ATS server will run on port 4000 by default.

### 3. Start the Main Application

```bash
npm run dev
```

### 4. Access the ATS Interface

Navigate to `/ats` in your application to use the ATS functionality.

## API Endpoints

The ATS server provides these endpoints:

- `GET /health` - Server health check
- `POST /api/match` - Match single resume to JD
- `POST /api/match/multiple` - Match multiple resumes to JD

## Usage

1. **Upload Job Description**: Drag and drop or click to upload a job description file
2. **Upload Resumes**: Upload up to 5 resume files
3. **Match Analysis**: Click "Match Resumes" to start the analysis
4. **Review Results**: View match scores, missing skills, and feedback for each resume

## File Support

The system supports:
- **PDF files** (.pdf)
- **Word documents** (.doc, .docx)

## Error Handling

The system handles various error scenarios:
- Invalid file types
- Server connectivity issues
- AI API errors
- File parsing errors

## Customization

### Adding New Analysis Features

1. Extend the `openaiService.ts` in the ATS-System
2. Add new routes in `match.ts`
3. Update the frontend service in `atsService.ts`
4. Enhance the UI component as needed

### Styling

The UI uses Tailwind CSS and shadcn/ui components. You can customize the styling by modifying the component classes.

## Troubleshooting

### Server Not Starting
- Check if port 4000 is available
- Ensure all dependencies are installed
- Verify environment variables are set

### File Upload Issues
- Check file format (PDF, DOC, DOCX only)
- Ensure files are not corrupted
- Verify file size limits

### AI Analysis Errors
- Verify Gemini API key is valid
- Check API quota limits
- Ensure proper file parsing

## Development

### Adding New Features

1. **Backend**: Modify the ATS-System server
2. **Frontend**: Update the service layer and UI components
3. **Testing**: Test with various file types and scenarios

### Testing

Test the system with:
- Different file formats
- Various resume styles
- Different job description types
- Edge cases (empty files, large files, etc.)

## Security Considerations

- File uploads are validated for type and size
- Temporary files are cleaned up
- API keys are stored securely
- CORS is properly configured

## Performance

- Files are processed asynchronously
- Multiple resumes can be processed in parallel
- Progress indicators provide user feedback
- Error handling prevents crashes

## Future Enhancements

Potential improvements:
- Resume parsing improvements
- More detailed analysis
- Historical data tracking
- Integration with job boards
- Advanced filtering and sorting 
