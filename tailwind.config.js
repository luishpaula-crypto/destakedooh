/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#093758', // Brand Blue
                    dark: '#052035',
                    light: '#16507a',
                },
                secondary: {
                    DEFAULT: '#64748b', // Slate
                    dark: '#334155',
                },
                dark: {
                    DEFAULT: '#0f172a', // Slate 900
                    card: '#1e293b', // Slate 800
                }
            }
        },
    },
    plugins: [],
}
