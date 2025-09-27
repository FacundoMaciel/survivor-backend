import Survivor from '../models/Survivor';

const seedSurvivors = async () => {
  try {
    const existingSurvivors = await Survivor.countDocuments();

    if (existingSurvivors > 0) {
      console.log('Database already has survivors, skipping seeding');
      return;
    }

    const sampleSurvivors = [
      {
        name: "Liga Premier 2025",
        competition: [
          {
            matchId: "1",
            home: { name: "Manchester United", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
            visitor: { name: "Liverpool", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }
          },
          {
            matchId: "2",
            home: { name: "Arsenal", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
            visitor: { name: "Chelsea", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }
          },
          {
            matchId: "3",
            home: { name: "Manchester City", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
            visitor: { name: "Tottenham", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }
          }
        ],
        startDate: new Date('2025-09-26'),
        lives: 3
      },
      {
        name: "La Liga Survivor",
        competition: [
          {
            matchId: "4",
            home: { name: "Real Madrid", flag: "🇪🇸" },
            visitor: { name: "Barcelona", flag: "🇪🇸" }
          },
          {
            matchId: "5",
            home: { name: "Atletico Madrid", flag: "🇪🇸" },
            visitor: { name: "Sevilla", flag: "🇪🇸" }
          },
          {
            matchId: "6",
            home: { name: "Valencia", flag: "🇪🇸" },
            visitor: { name: "Villarreal", flag: "🇪🇸" }
          }
        ],
        startDate: new Date('2025-09-26'),
        lives: 3
      },
      {
        name: "Champions League Knockout",
        competition: [
          {
            matchId: "7",
            home: { name: "PSG", flag: "🇫🇷" },
            visitor: { name: "Bayern Munich", flag: "🇩🇪" }
          },
          {
            matchId: "8",
            home: { name: "AC Milan", flag: "🇮🇹" },
            visitor: { name: "Inter Milan", flag: "🇮🇹" }
          },
          {
            matchId: "9",
            home: { name: "Porto", flag: "🇵🇹" },
            visitor: { name: "Benfica", flag: "🇵🇹" }
          }
        ],
        startDate: new Date('2025-09-26'),
        lives: 3
      }
    ];

    await Survivor.insertMany(sampleSurvivors);
    console.log('✅ Sample survivors seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding survivors:', error);
  }
};

export default seedSurvivors;