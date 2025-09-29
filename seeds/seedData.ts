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
            jornada: 1,
            matches: [
              { matchId: "1", home: { name: "Manchester United", flag: "🏴" }, visitor: { name: "Liverpool", flag: "🏴" } },
              { matchId: "2", home: { name: "Arsenal", flag: "🏴" }, visitor: { name: "Chelsea", flag: "🏴" } },
              { matchId: "3", home: { name: "Manchester City", flag: "🏴" }, visitor: { name: "Tottenham", flag: "🏴" } }
            ]
          },
          {
            jornada: 2,
            matches: [
              { matchId: "4", home: { name: "Newcastle", flag: "🏴" }, visitor: { name: "Aston Villa", flag: "🏴" } },
              { matchId: "5", home: { name: "Everton", flag: "🏴" }, visitor: { name: "West Ham", flag: "🏴" } },
              { matchId: "6", home: { name: "Leicester", flag: "🏴" }, visitor: { name: "Brighton", flag: "🏴" } }
            ]
          },
          {
            jornada: 3,
            matches: [
              { matchId: "7", home: { name: "Fulham", flag: "🏴" }, visitor: { name: "Crystal Palace", flag: "🏴" } },
              { matchId: "8", home: { name: "Brentford", flag: "🏴" }, visitor: { name: "Wolves", flag: "🏴" } },
              { matchId: "9", home: { name: "Leeds", flag: "🏴" }, visitor: { name: "Southampton", flag: "🏴" } }
            ]
          }
        ],
        startDate: new Date('2025-09-26'),
        lives: 9
      },
      {
        name: "La Liga Survivor",
        competition: [
          {
            jornada: 1,
            matches: [
              { matchId: "10", home: { name: "Real Madrid", flag: "🇪🇸" }, visitor: { name: "Barcelona", flag: "🇪🇸" } },
              { matchId: "11", home: { name: "Atletico Madrid", flag: "🇪🇸" }, visitor: { name: "Sevilla", flag: "🇪🇸" } },
              { matchId: "12", home: { name: "Valencia", flag: "🇪🇸" }, visitor: { name: "Villarreal", flag: "🇪🇸" } }
            ]
          },
          {
            jornada: 2,
            matches: [
              { matchId: "13", home: { name: "Real Sociedad", flag: "🇪🇸" }, visitor: { name: "Athletic Club", flag: "🇪🇸" } },
              { matchId: "14", home: { name: "Betis", flag: "🇪🇸" }, visitor: { name: "Getafe", flag: "🇪🇸" } },
              { matchId: "15", home: { name: "Celta Vigo", flag: "🇪🇸" }, visitor: { name: "Osasuna", flag: "🇪🇸" } }
            ]
          },
          {
            jornada: 3,
            matches: [
              { matchId: "16", home: { name: "Mallorca", flag: "🇪🇸" }, visitor: { name: "Almeria", flag: "🇪🇸" } },
              { matchId: "17", home: { name: "Rayo Vallecano", flag: "🇪🇸" }, visitor: { name: "Las Palmas", flag: "🇪🇸" } },
              { matchId: "18", home: { name: "Granada", flag: "🇪🇸" }, visitor: { name: "Cadiz", flag: "🇪🇸" } }
            ]
          }
        ],
        startDate: new Date('2025-09-26'),
        lives: 9
      },
      {
        name: "Champions League Knockout",
        competition: [
          {
            jornada: 1,
            matches: [
              { matchId: "19", home: { name: "PSG", flag: "🇫🇷" }, visitor: { name: "Bayern Munich", flag: "🇩🇪" } },
              { matchId: "20", home: { name: "AC Milan", flag: "🇮🇹" }, visitor: { name: "Inter Milan", flag: "🇮🇹" } },
              { matchId: "21", home: { name: "Porto", flag: "🇵🇹" }, visitor: { name: "Benfica", flag: "🇵🇹" } }
            ]
          },
          {
            jornada: 2,
            matches: [
              { matchId: "22", home: { name: "Borussia Dortmund", flag: "🇩🇪" }, visitor: { name: "Ajax", flag: "🇳🇱" } },
              { matchId: "23", home: { name: "Juventus", flag: "🇮🇹" }, visitor: { name: "Napoli", flag: "🇮🇹" } },
              { matchId: "24", home: { name: "Celtic", flag: "🏴" }, visitor: { name: "Rangers", flag: "🏴" } }
            ]
          },
          {
            jornada: 3,
            matches: [
              { matchId: "25", home: { name: "Galatasaray", flag: "🇹🇷" }, visitor: { name: "Fenerbahce", flag: "🇹🇷" } },
              { matchId: "26", home: { name: "Shakhtar Donetsk", flag: "🇺🇦" }, visitor: { name: "Dynamo Kyiv", flag: "🇺🇦" } },
              { matchId: "27", home: { name: "Red Bull Salzburg", flag: "🇦🇹" }, visitor: { name: "RB Leipzig", flag: "🇩🇪" } }
            ]
          }
        ],
        startDate: new Date('2025-09-26'),
        lives: 9
      }
    ];

    await Survivor.insertMany(sampleSurvivors);
    console.log('✅ Sample survivors seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding survivors:', error);
  }
};

export default seedSurvivors;