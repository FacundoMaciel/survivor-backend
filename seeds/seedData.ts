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
          { matchId: "1", home: { name: "Manchester United", flag: "🏴" }, visitor: { name: "Liverpool", flag: "🏴" } },
          { matchId: "2", home: { name: "Arsenal", flag: "🏴" }, visitor: { name: "Chelsea", flag: "🏴" } },
          { matchId: "3", home: { name: "Tottenham", flag: "🏴" }, visitor: { name: "Everton", flag: "🏴" } },
          { matchId: "4", home: { name: "Leeds United", flag: "🏴" }, visitor: { name: "Brighton", flag: "🏴" } },
          { matchId: "5", home: { name: "Newcastle", flag: "🏴" }, visitor: { name: "Crystal Palace", flag: "🏴" } },
          { matchId: "6", home: { name: "Manchester City", flag: "🏴" }, visitor: { name: "Fulham", flag: "🏴" } },
          { matchId: "7", home: { name: "Wolves", flag: "🏴" }, visitor: { name: "Nottingham Forest", flag: "🏴" } },
          { matchId: "8", home: { name: "Aston Villa", flag: "🏴" }, visitor: { name: "Brentford", flag: "🏴" } },
          { matchId: "9", home: { name: "West Ham", flag: "🏴" }, visitor: { name: "Sheffield United", flag: "🏴" } }
        ],
        startDate: new Date('2025-09-26'),
      },
      {
        name: "La Liga Survivor",
        competition: [
          { matchId: "10", home: { name: "Real Madrid", flag: "🇪🇸" }, visitor: { name: "Barcelona", flag: "🇪🇸" } },
          { matchId: "11", home: { name: "Atletico Madrid", flag: "🇪🇸" }, visitor: { name: "Sevilla", flag: "🇪🇸" } },
          { matchId: "12", home: { name: "Valencia", flag: "🇪🇸" }, visitor: { name: "Villarreal", flag: "🇪🇸" } },
          { matchId: "13", home: { name: "Real Sociedad", flag: "🇪🇸" }, visitor: { name: "Betis", flag: "🇪🇸" } },
          { matchId: "14", home: { name: "Celta Vigo", flag: "🇪🇸" }, visitor: { name: "Osasuna", flag: "🇪🇸" } },
          { matchId: "15", home: { name: "Granada", flag: "🇪🇸" }, visitor: { name: "Almeria", flag: "🇪🇸" } }
        ],
        startDate: new Date('2025-09-26'),
      },
      {
        name: "Champions League Knockout",
        competition: [
          { matchId: "16", home: { name: "PSG", flag: "🇫🇷" }, visitor: { name: "Bayern Munich", flag: "🇩🇪" } },
          { matchId: "17", home: { name: "AC Milan", flag: "🇮🇹" }, visitor: { name: "Inter Milan", flag: "🇮🇹" } },
          { matchId: "18", home: { name: "Porto", flag: "🇵🇹" }, visitor: { name: "Benfica", flag: "🇵🇹" } },
          { matchId: "19", home: { name: "Ajax", flag: "🇳🇱" }, visitor: { name: "Celtic", flag: "🏴" } },
          { matchId: "20", home: { name: "Galatasaray", flag: "🇹🇷" }, visitor: { name: "Shakhtar Donetsk", flag: "🇺🇦" } }
        ],
        startDate: new Date('2025-09-26'),
      },
      {
        name: "Serie A Survivor",
        competition: [
          { matchId: "21", home: { name: "Juventus", flag: "🇮🇹" }, visitor: { name: "Napoli", flag: "🇮🇹" } },
          { matchId: "22", home: { name: "Roma", flag: "🇮🇹" }, visitor: { name: "Lazio", flag: "🇮🇹" } },
          { matchId: "23", home: { name: "Fiorentina", flag: "🇮🇹" }, visitor: { name: "Torino", flag: "🇮🇹" } },
          { matchId: "24", home: { name: "Sassuolo", flag: "🇮🇹" }, visitor: { name: "Udinese", flag: "🇮🇹" } }
        ],
        startDate: new Date('2025-09-26'),
      }
    ];
    // Insertar survivors con el campo lives dinámico
    const survivorsWithLives = sampleSurvivors.map(s => ({
      ...s,
      lives: s.competition.length, // 👈 dinámico según los partidos
    }));

    await Survivor.insertMany(survivorsWithLives);
    console.log('✅ Sample survivors seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding survivors:', error);
  }
};

export default seedSurvivors;
