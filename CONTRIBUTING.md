# Contributing to Diwali Millionaire

Thank you for your interest in contributing to the Diwali Millionaire project!

## Development Setup

1. **Prerequisites**
   - Node.js 20.x or higher
   - npm 10.x or higher

2. **Installation**
   ```bash
   git clone https://github.com/chz160/DiwaliMillionare.git
   cd DiwaliMillionare
   npm install
   ```

3. **Development Server**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/`

## Project Structure

```
src/
├── app/
│   ├── app.ts          # Main component with game logic
│   ├── app.html        # Template with game UI
│   ├── app.css         # Diwali-themed styles
│   ├── app.spec.ts     # Unit tests
│   ├── app.config.ts   # App configuration
│   └── app.routes.ts   # Routing configuration (currently empty)
├── index.html          # Main HTML file
├── main.ts             # Application bootstrap
└── styles.css          # Global styles
```

## Making Changes

### Adding Questions

Edit `src/app/app.ts` and update the `questions` signal:

```typescript
questions = signal<Question[]>([
  {
    question: 'Your question here?',
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    correctAnswer: 0  // Index of correct answer (0-3)
  },
  // Add more questions...
]);
```

### Modifying Prize Levels

Edit the `moneyLadder` signal in `src/app/app.ts`:

```typescript
moneyLadder = signal<MoneyLevel[]>([
  { amount: '₹10,00,000', reached: false, current: false },
  // Modify amounts as needed...
]);
```

**Note**: Ensure the number of questions matches or exceeds the number of prize levels for proper game flow.

### Styling Changes

- **Theme Colors**: Modify CSS custom properties in `src/app/app.css`
- **Layout**: Adjust grid/flexbox properties in component CSS
- **Animations**: Update keyframe animations in `src/app/app.css`

## Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Build for Production
```bash
npm run build
```

## Code Style

- Use TypeScript for type safety
- Follow Angular style guide
- Use Angular signals for reactive state
- Write descriptive component and variable names
- Add comments for complex logic

## Submitting Changes

1. Create a new branch for your feature
2. Make your changes
3. Run tests to ensure nothing breaks
4. Build the project to verify
5. Submit a pull request with a clear description

## Future Enhancement Ideas

- [ ] Backend integration for persistent scores
- [ ] Multiple question sets/categories
- [ ] Difficulty levels
- [ ] Lifelines (50:50, Ask the Audience, Phone a Friend)
- [ ] Sound effects and background music
- [ ] Multiplayer support
- [ ] Leaderboard
- [ ] Admin panel for managing questions
- [ ] Timer for questions
- [ ] Different themes (not just Diwali)

## Need Help?

Open an issue on GitHub with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

MIT License - see LICENSE file for details
