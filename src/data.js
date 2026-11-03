// Sample data for the prototype. Replace with real data (for example from Firebase) later.

export const clubs = [
  { id: 'football', name: 'Football Academy', type: 'Sport', when: 'Saturdays, 9:00 am', ages: 'Ages 12 to 17', note: 'Coaches confirm attendance.' },
  { id: 'coders', name: 'Junior Coders', type: 'Tech', when: 'Wednesdays, 4:30 pm', ages: 'Ages 13 to 17', note: 'Led by checked student mentors.' },
  { id: 'chess', name: 'Chess and Debate Club', type: 'Study', when: 'Tuesdays, 4:00 pm', ages: 'Ages 12 to 17', note: 'Coaches confirm attendance.' },
  { id: 'choir', name: 'Community Choir', type: 'Arts', when: 'Thursdays, 4:30 pm', ages: 'Ages 12 to 17', note: 'Leaders confirm attendance.' },
  { id: 'netball', name: 'Netball Club', type: 'Sport', when: 'Mondays, 4:00 pm', ages: 'Ages 12 to 17', note: 'Coaches confirm attendance.' }
];

export const clubFilters = ['All', 'Sport', 'Tech', 'Study', 'Arts'];

export const lessons = [
  { id: 'python', meta: 'Tech, 6 min, from Tendai N.', title: 'Build a quiz in 20 lines of Python', task: 'Write a 5 question quiz and show it at Junior Coders.', reward: 'Earns the Builder badge when your mentor confirms it.', size: '14 MB' },
  { id: 'chess', meta: 'Study, 8 min, from your Chess and Debate coach', title: 'Three opening traps to know', task: 'Play each trap once against a friend and note what happened.', reward: 'Earns the Strategist badge when your coach confirms it.', size: '22 MB' },
  { id: 'voice', meta: 'Arts, 5 min, from your choir leader', title: 'Warm up your voice in 60 seconds', task: 'Do the warm up before each rehearsal this week.', reward: 'Earns the Steady Voice badge when your leader confirms it.', size: '9 MB' }
];

export const children = [
  { id: 'tino', label: 'Tino' },
  { id: 'rudo', label: 'Rudo' }
];

export const guardianData = {
  tino: {
    confirmed: '2 of 3 sessions',
    message: '1 message from a mentor this week.',
    sessions: [
      { name: 'Football Academy', detail: 'Saturday, confirmed by the coach' },
      { name: 'Chess and Debate Club', detail: 'Tuesday, confirmed by the coach' }
    ]
  },
  rudo: {
    confirmed: '2 of 3 sessions',
    message: 'No messages from mentors this week.',
    sessions: [
      { name: 'Netball Club', detail: 'Monday, confirmed by the coach' },
      { name: 'Community Choir', detail: 'Thursday, confirmed by the leader' }
    ]
  }
};

export const reportReasons = ['Something the mentor said', 'Something that felt unsafe', 'Something else'];
