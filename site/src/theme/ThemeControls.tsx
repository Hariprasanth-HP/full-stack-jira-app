// components/ThemeControls.tsx
import { useTheme } from './ThemeProvider';
import type { ThemeName } from './token';

export function ThemeControls() {
  const { theme, setTheme, setTokens, resetTokens } = useTheme();

  return (
    <div className='flex gap-2 items-center'>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        className='rounded px-2 py-1 bg-secondary text-secondary-foreground'
      >
        <option value='light'>Light</option>
        <option value='dark'>Dark</option>
        <option value='system'>System</option>
      </select>

      <button
        onClick={() =>
          setTokens({
            primary: '280 70% 50%',
            'primary-foreground': '0 0% 100%',
          })
        }
        className='px-3 py-1 rounded bg-primary text-primary-foreground'
      >
        Set Purple Primary
      </button>

      <button
        onClick={() => resetTokens()}
        className='px-3 py-1 rounded border'
      >
        Reset
      </button>
    </div>
  );
}
