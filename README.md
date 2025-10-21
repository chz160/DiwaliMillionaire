# Who Wants To Be A Diwali Millionaire

A Diwali-themed quiz game based on "Who Wants to Be a Millionaire" for use at IRL Diwali festival parties. This Angular 20 application allows party hosts to facilitate an interactive trivia game with a festive Indian theme.

## Features

- 🪔 Beautiful Diwali-themed UI with traditional colors and decorations
- 🎆 Interactive quiz game format with multiple-choice questions
- 💰 Prize ladder showing progression through the game
- ✨ Animated transitions and visual feedback
- 📱 Responsive design that works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chz160/DiwaliMillionare.git
cd DiwaliMillionare
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you make changes to the source files.

### Build

Build the project for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Testing

Run unit tests:
```bash
npm test
```

## How to Use

1. **Start Screen**: Click "Start Game" to begin
2. **Answer Questions**: Select one of the four answer options for each question
3. **Track Progress**: Watch the prize ladder on the right to see your current winnings
4. **Game Over**: When you finish all questions or answer incorrectly, you'll see your final prize
5. **Play Again**: Click "Play Again" to restart the game

## Customization

### Adding Questions

Edit the `questions` array in `src/app/app.ts` to add or modify quiz questions:

```typescript
questions = signal<Question[]>([
  {
    question: 'Your question here?',
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    correctAnswer: 0 // Index of the correct answer (0-3)
  }
]);
```

### Modifying Prize Amounts

Edit the `moneyLadder` array in `src/app/app.ts` to change prize values:

```typescript
moneyLadder = signal<MoneyLevel[]>([
  { amount: '₹10,00,000', reached: false, current: false },
  // ... add more levels as needed
]);
```

### Styling

- Main theme colors are defined in `src/app/app.css` using CSS custom properties
- Global styles are in `src/styles.css`

## Technology Stack

- **Angular 20**: Modern web framework
- **TypeScript**: Type-safe JavaScript
- **CSS**: Custom styling with animations
- **Standalone Components**: Using Angular's latest component architecture

## Future Enhancements

- Backend integration for persistent scoring
- Multiple question sets/difficulty levels
- Lifelines (50:50, Ask the Audience, Phone a Friend)
- Sound effects and background music
- Multiplayer support
- Admin panel for managing questions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
