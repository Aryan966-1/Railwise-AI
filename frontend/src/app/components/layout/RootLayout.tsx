import { Outlet } from 'react-router';
import { Header } from './Header';
import { ProgressIndicator } from './ProgressIndicator';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { ThemeProvider } from '../../contexts/ThemeContext';

export function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <Header />
        <ProgressIndicator />
        <main>
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}
