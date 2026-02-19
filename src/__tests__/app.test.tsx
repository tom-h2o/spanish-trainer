import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock Supabase Auth component to avoid Stitches CSSOM issues in JSDOM
vi.mock('@supabase/auth-ui-react', () => ({
    Auth: () => <div data-testid="mock-auth">Mock Auth</div>
}));

vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
        }
    }
}));

describe('App Component', () => {
    it('renders the login screen when unauthorized', async () => {
        render(<App />);
        expect(await screen.findByText('🇪🇸 Sign In to Play')).toBeInTheDocument();
        expect(screen.getByTestId('mock-auth')).toBeInTheDocument();
    });
});
