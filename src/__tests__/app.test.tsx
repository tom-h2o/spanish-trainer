import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
    it('renders the header correctly', () => {
        render(<App />);
        expect(screen.getByText('🇪🇸 Spanish Flashcards')).toBeInTheDocument();
        expect(screen.getByText('Master your daily vocabulary with spaced repetition.')).toBeInTheDocument();
    });
});
