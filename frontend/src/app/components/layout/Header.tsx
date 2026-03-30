import { Moon, Sun, Train } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router';
import { currentUser } from '../../utils/currentUser';

export function Header() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navItems = [
    { to: '/', label: 'Book Train' },
    { to: '/my-bookings', label: 'My Bookings' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
          >
            <Train className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            RailFuture
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm"
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="px-3 py-1 rounded-full bg-muted/50 text-muted-foreground">
              {currentUser.name}
            </span>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center backdrop-blur-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {isDark ? (
              <Moon className="w-5 h-5 text-purple-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </motion.header>
  );
}
