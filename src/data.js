// Sample data for the prototype. Replace with real data (for example from Firebase) later.
// `day` is the weekday of the club session (0 = Sunday).

export const clubs = [
  {
    id: 'football', name: 'Football Academy', type: 'Sport', day: 6, time: '9:00 am',
    when: 'Saturdays, 9:00 am', short: 'Sat, 9:00 am', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Coach · Farai M.', session: 'Training session', confirmer: 'Coach',
    note: 'Coaches confirm attendance.',
    about: 'Weekly training with a checked coach. Your guardian approves before you join, and sees every session the coach confirms.'
  },
  {
    id: 'coders', name: 'Junior Coders', type: 'Tech', day: 3, time: '4:30 pm',
    when: 'Wednesdays, 4:30 pm', short: 'Wed, 4:30 pm', ages: 'Ages 13 to 17', range: '13–17',
    lead: 'Mentor · Tendai N.', session: 'Coding session', confirmer: 'Mentor',
    note: 'Led by checked student mentors.',
    about: 'Build small apps and games with student mentors who have passed ID and safeguarding checks.'
  },
  {
    id: 'robotics', name: 'Robotics & AI', type: 'STEM', day: 5, time: '4:00 pm',
    when: 'Fridays, 4:00 pm', short: 'Fri, 4:00 pm', ages: 'Ages 12 to 16', range: '12–16',
    lead: 'Mentor · Ruvimbo K.', session: 'Build session', confirmer: 'Mentor',
    note: 'Hands-on projects and real AI ideas.',
    about: 'Hands-on robot builds and simple AI projects in small groups, led by checked mentors.'
  },
  {
    id: 'vocational', name: 'Vocational Training', type: 'Career', day: 6, time: '10:00 am',
    when: 'Saturdays, 10:00 am', short: 'Sat, 10:00 am', ages: 'Ages 13 to 17', range: '13–17',
    lead: 'Trainer · Blessing T.', session: 'Workshop', confirmer: 'Trainer',
    note: 'Practical skills for future work readiness.',
    about: 'Practical skills like basic carpentry, tailoring and repairs, taught by checked trainers.'
  },
  {
    id: 'chess', name: 'Chess and Debate Club', shortName: 'Chess and Debate', type: 'Study', day: 2, time: '4:00 pm',
    when: 'Tuesdays, 4:00 pm', short: 'Tue, 4:00 pm', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Coach · Simba D.', session: 'Club session', confirmer: 'Coach',
    note: 'Coaches confirm attendance.',
    about: 'Chess games and friendly debates that build focus and confidence. Coaches confirm every session.'
  },
  {
    id: 'choir', name: 'Community Choir', type: 'Arts', day: 4, time: '4:30 pm',
    when: 'Thursdays, 4:30 pm', short: 'Thu, 4:30 pm', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Leader · Nyasha P.', session: 'Rehearsal', confirmer: 'Leader',
    note: 'Leaders confirm attendance.',
    about: 'Weekly rehearsals and local performances with a checked choir leader.'
  },
  {
    id: 'netball', name: 'Netball Club', type: 'Sport', day: 1, time: '4:00 pm',
    when: 'Mondays, 4:00 pm', short: 'Mon, 4:00 pm', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Coach · Chipo G.', session: 'Training session', confirmer: 'Coach',
    note: 'Coaches confirm attendance.',
    about: 'Weekly netball training and friendly matches with a checked coach.'
  }
];

export const clubById = Object.fromEntries(clubs.map((c) => [c.id, c]));

export const categories = [
  { id: 'Sport', icon: 'sport' },
  { id: 'Tech', icon: 'code' },
  { id: 'Study', icon: 'pawn' },
  { id: 'Arts', icon: 'music' },
  { id: 'STEM', icon: 'robot' },
  { id: 'Career', icon: 'briefcase' }
];

export const categoryIcon = Object.fromEntries(categories.map((c) => [c.id, c.icon]));

export const clubFilters = ['All', ...categories.map((c) => c.id)];

// The clubs Tino already goes to, shown on Today.
export const myClubs = ['football', 'chess'];

export const lessons = [
  {
    id: 'python', type: 'Tech', title: 'Build a quiz in 20 lines of Python', minutes: 6, size: '14 MB',
    by: 'Tendai N.', from: 'from your mentor Tendai N.', badge: 'Builder', confirmer: 'mentor',
    task: 'Write a 5 question quiz and show it at Junior Coders.'
  },
  {
    id: 'chess', type: 'Study', title: 'Three opening traps to know', minutes: 8, size: '22 MB',
    by: 'Chess coach', from: 'from your Chess and Debate coach', badge: 'Strategist', confirmer: 'coach',
    task: 'Play each trap once against a friend and note what happened.'
  },
  {
    id: 'voice', type: 'Arts', title: 'Warm up your voice in 60 seconds', minutes: 5, size: '9 MB',
    by: 'Choir leader', from: 'from your choir leader', badge: 'Steady Voice', confirmer: 'leader',
    task: 'Do the warm up before each rehearsal this week.'
  }
];

export const lessonById = Object.fromEntries(lessons.map((l) => [l.id, l]));

export const children = [
  { id: 'tino', label: 'Tino' },
  { id: 'rudo', label: 'Rudo' }
];

export const guardianData = {
  tino: {
    confirmed: 2,
    goal: 3,
    message: '1 message from a mentor this week.',
    sessions: [
      { name: 'Football Academy', detail: 'Saturday, confirmed by the coach' },
      { name: 'Chess and Debate Club', detail: 'Tuesday, confirmed by the coach' }
    ]
  },
  rudo: {
    confirmed: 2,
    goal: 3,
    message: 'No messages from mentors this week.',
    sessions: [
      { name: 'Netball Club', detail: 'Monday, confirmed by the coach' },
      { name: 'Community Choir', detail: 'Thursday, confirmed by the leader' }
    ]
  }
};

export const reportReasons = ['Something the mentor said', 'Something that felt unsafe', 'Something else'];
