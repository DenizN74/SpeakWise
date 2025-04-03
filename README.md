# LangLearn - Interactive Language Learning Platform

LangLearn is a modern web application designed to help users learn languages through interactive lessons, speaking practice, and community engagement.

## Features

### 1. Interactive Learning
- Structured lessons with progressive difficulty levels
- Multimedia content (text, images, video, audio)
- Interactive quizzes and assessments
- Real-time progress tracking

### 2. Speaking Practice
- AI-powered pronunciation assessment
- Real-life conversation scenarios
- Voice recording and playback
- Detailed feedback on fluency and accuracy

### 3. Community Features
- Discussion forums
- Writing practice with peer feedback
- Achievement badges and ranking system
- Community contributions and rewards

### 4. Multilingual Support
- Content available in multiple languages
- User interface in English
- Automatic content translation
- Language preference settings

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI Integration**: GPT-3.5 for translations and writing analysis
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Supabase account
- Environment variables set up

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd language-learning-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The application uses Supabase for data storage. The database schema includes:

- User profiles and authentication
- Lessons and modules
- Speaking scenarios
- Community features
- Multilingual content support

Database migrations are located in `/supabase/migrations/`.

## Project Structure

```
├── src/
│   ├── components/     # Reusable React components
│   ├── contexts/       # React context providers
│   ├── lib/           # Utility functions and API clients
│   ├── pages/         # Page components
│   └── types/         # TypeScript type definitions
├── supabase/
│   ├── functions/     # Edge functions
│   └── migrations/    # Database migrations
└── public/           # Static assets
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices and hooks
- Use Tailwind CSS for styling
- Implement responsive design
- Handle errors gracefully

### Database
- Use RLS policies for security
- Create migrations for schema changes
- Maintain referential integrity
- Include proper indexes

### Edge Functions
- Handle CORS properly
- Include error handling
- Use TypeScript
- Follow RESTful principles

### Testing
- Write unit tests for components
- Test edge functions
- Verify database migrations
- Check responsive design

## Deployment

The application is deployed to Netlify. The deployment process is automated through GitHub actions.

To deploy manually:
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.