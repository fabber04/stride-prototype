// Catalogue data for the prototype. src/api/seed.js copies it into the database, so screens read
// clubs, lessons and mentors from the backend, not from here.
// `day` is the weekday of the club session (0 = Sunday).

export const clubs = [
  {
    id: 'football', mentorId: 'farai', name: 'Football Academy', type: 'Sport', day: 6, time: '9:00 am',
    when: 'Saturdays, 9:00 am', short: 'Sat, 9:00 am', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Coach · Farai M.', session: 'Training session', confirmer: 'Coach',
    note: 'Coaches confirm attendance.',
    about: 'Weekly training with a checked coach. Your guardian approves before you join, and sees every session the coach confirms.'
  },
  {
    id: 'coders', mentorId: 'fabulous', name: 'Junior Coders', type: 'Tech', day: 3, time: '4:30 pm',
    when: 'Wednesdays, 4:30 pm', short: 'Wed, 4:30 pm', ages: 'Ages 13 to 17', range: '13–17',
    lead: 'Mentor · Fabulous L.', session: 'Coding session', confirmer: 'Mentor',
    note: 'Led by checked student mentors.',
    about: 'Build small apps and games with student mentors who have passed ID and safeguarding checks.'
  },
  {
    id: 'robotics', mentorId: 'ruvimbo', name: 'Robotics & AI', type: 'STEM', day: 5, time: '4:00 pm',
    when: 'Fridays, 4:00 pm', short: 'Fri, 4:00 pm', ages: 'Ages 12 to 16', range: '12–16',
    lead: 'Mentor · Ruvimbo K.', session: 'Build session', confirmer: 'Mentor',
    note: 'Hands-on projects and real AI ideas.',
    about: 'Hands-on robot builds and simple AI projects in small groups, led by checked mentors.'
  },
  {
    id: 'vocational', mentorId: 'blessing', name: 'Vocational Training', type: 'Career', day: 6, time: '10:00 am',
    when: 'Saturdays, 10:00 am', short: 'Sat, 10:00 am', ages: 'Ages 13 to 17', range: '13–17',
    lead: 'Trainer · Blessing T.', session: 'Workshop', confirmer: 'Trainer',
    note: 'Practical skills for future work readiness.',
    about: 'Practical skills like basic carpentry, tailoring and repairs, taught by checked trainers.'
  },
  {
    id: 'chess', mentorId: 'simba', name: 'Chess and Debate Club', shortName: 'Chess and Debate', type: 'Study', day: 2, time: '4:00 pm',
    when: 'Tuesdays, 4:00 pm', short: 'Tue, 4:00 pm', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Coach · Simba D.', session: 'Club session', confirmer: 'Coach',
    note: 'Coaches confirm attendance.',
    about: 'Chess games and friendly debates that build focus and confidence. Coaches confirm every session.'
  },
  {
    id: 'choir', mentorId: 'nyasha', name: 'Community Choir', type: 'Arts', day: 4, time: '4:30 pm',
    when: 'Thursdays, 4:30 pm', short: 'Thu, 4:30 pm', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Leader · Nyasha P.', session: 'Rehearsal', confirmer: 'Leader',
    note: 'Leaders confirm attendance.',
    about: 'Weekly rehearsals and local performances with a checked choir leader.'
  },
  {
    id: 'netball', mentorId: 'chipo', name: 'Netball Club', type: 'Sport', day: 1, time: '4:00 pm',
    when: 'Mondays, 4:00 pm', short: 'Mon, 4:00 pm', ages: 'Ages 12 to 17', range: '12–17',
    lead: 'Coach · Chipo G.', session: 'Training session', confirmer: 'Coach',
    note: 'Coaches confirm attendance.',
    about: 'Weekly netball training and friendly matches with a checked coach.'
  }
];


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

// What every club's leader passed before the club could join Stride.
export function clubChecks(club) {
  const role = club.lead.split(' · ')[0];
  return [`${role} ID checked`, 'Safeguarding training complete', 'Venue and first aid checked'];
}

// Cost is a common reason teens drop out, so each club says who covers it. Sponsors are placeholders.
export const clubCost = {
  football: { price: 'Free to join', note: 'Boots and kit covered by the Stride youth fund' },
  coders: { price: 'Free to join', note: 'Laptops provided at every session' },
  robotics: { price: 'Free to join', note: 'Robot kits covered by a local sponsor' },
  vocational: { price: 'Free to join', note: 'Tools and materials covered by a local sponsor' },
  chess: { price: 'Free to join', note: 'Boards and clocks provided' },
  choir: { price: 'Free to join', note: 'Transport to performances covered' },
  netball: { price: '$2 a term', note: 'Waived for any family who asks' }
};

// Other families at each club, so guardians can get to know each other.
export const clubParents = {
  football: { count: 9, names: ["Kuda's mum", "Tapiwa's dad"] },
  chess: { count: 6, names: ["Ruva's gran", "Farai's mum"] },
  netball: { count: 11, names: ["Chipo's mum", "Anesu's dad"] },
  choir: { count: 7, names: ["Tariro's aunt", "Nyasha's mum"] },
  coders: { count: 8, names: ["Takudzwa's dad", "Ropa's mum"] }
};

// Tino's friends who already go to each club. Seeing a friend there is the strongest nudge to try one.
export const clubFriends = {
  football: ['Kuda', 'Tapiwa'],
  coders: ['Ropa'],
  robotics: ['Kuda'],
  vocational: ['Tapiwa'],
  chess: ['Farai'],
  choir: [],
  netball: []
};

// Places left this term, only where a club is nearly full.
export const clubSpots = { robotics: 2, vocational: 1, coders: 4 };

// `watched` is minutes already played; `club` is the club whose leader sets and confirms the task.
export const lessons = [
  {
    id: 'python', mentorId: 'fabulous', type: 'Tech', club: 'coders', title: 'Build a quiz in 20 lines of Python', minutes: 6, size: '14 MB',
    by: 'Fabulous L.', from: 'from your mentor Fabulous L.', badge: 'Builder', confirmer: 'mentor', watched: 0,
    task: 'Write a 5 question quiz and show it at Junior Coders.',
    steps: ['Watch the lesson to the end', 'Write five questions with answers', 'Run it for a friend at Junior Coders']
  },
  {
    id: 'chess', mentorId: 'simba', type: 'Study', club: 'chess', title: 'Three opening traps to know', minutes: 8, size: '22 MB',
    by: 'Simba D.', from: 'from your Chess and Debate coach', badge: 'Strategist', confirmer: 'coach', watched: 3,
    task: 'Play each trap once against a friend and note what happened.',
    steps: ['Set up each trap on a board', 'Play each one against a friend', 'Write one line on what happened']
  },
  {
    id: 'voice', mentorId: 'nyasha', type: 'Arts', club: 'choir', title: 'Warm up your voice in 60 seconds', minutes: 5, size: '9 MB',
    by: 'Nyasha P.', from: 'from your choir leader', badge: 'Steady Voice', confirmer: 'leader', watched: 0,
    task: 'Do the warm up before each rehearsal this week.',
    steps: ['Learn the four warm up sounds', 'Do it before Thursday rehearsal', 'Do it before the next one too']
  },
  {
    id: 'linebot', mentorId: 'ruvimbo', type: 'STEM', club: 'robotics', title: 'Make a robot follow a line', minutes: 9, size: '24 MB',
    by: 'Ruvimbo K.', from: 'from your Robotics mentor', badge: 'Maker', confirmer: 'mentor', watched: 0,
    task: 'Sketch how the two sensors steer the robot and bring it to Robotics & AI.',
    steps: ['Watch how the sensors see the line', 'Sketch the left and right turns', 'Explain it to your group on Friday']
  },
  {
    id: 'stool', mentorId: 'blessing', type: 'Career', club: 'vocational', title: 'Measure twice, cut once', minutes: 7, size: '18 MB',
    by: 'Blessing T.', from: 'from your Vocational trainer', badge: 'Craftsperson', confirmer: 'trainer', watched: 0,
    task: 'Measure and mark the four legs of a stool on scrap wood.',
    steps: ['Watch the marking method', 'Mark four equal legs on scrap wood', 'Show your marks to the trainer']
  },
  {
    id: 'warmup', mentorId: 'farai', type: 'Sport', club: 'football', title: 'A five minute warm up that prevents injury', minutes: 5, size: '11 MB',
    by: 'Farai M.', from: 'from your Football coach', badge: 'Ready to Play', confirmer: 'coach', watched: 0,
    task: 'Lead the warm up for your team before Saturday training.',
    steps: ['Learn the five moves in order', 'Practise them at home once', 'Lead your team on Saturday']
  }
];

export const learnFilters = ['All', 'Saved', ...categories.map((c) => c.id)];


// Mentors a teen can open. `photo` lives in public/mentors; the avatar falls back to initials until it exists.
// Bios, notes and session counts are sample copy until each mentor replaces them with their own.
// `listed` mentors appear under More mentors for any teen. Club leaders are mentors too.
export const mentors = [
  {
    id: 'fabulous',
    listed: true,
    name: 'Fabulous Lashid',
    short: 'Fabulous L.',
    first: 'Fabulous',
    initials: 'FL',
    photo: 'mentors/fabulous.jpg',
    avatar: 'mentors/fabulous-face.jpg',
    role: 'Mentor at Junior Coders',
    badge: 'Stride Verified Mentor',
    since: 'Mentoring with Stride since 2025',
    stats: [
      { value: '4', label: 'checks passed' },
      { value: '40+', label: 'sessions led' },
      { value: '25', label: 'teens mentored' }
    ],
    bio: [
      'Fabulous leads Junior Coders every Wednesday, where 13 to 17 year olds build their first apps and games in small groups.',
      'He believes every young person can make something real with a laptop and a little patience, and he keeps sessions practical, friendly and on time.'
    ],
    parentNote:
      'I treat every session the way I would want my own family treated: on time, in a safe space, and with a short update for parents on what we built.',
    teaches: ['Python basics', 'Building small games', 'Problem solving', 'Confidence to present'],
    checks: ['ID verified', 'Safeguarding training complete', 'Approved by the Junior Coders club', 'References checked']
  },
  {
    id: 'charlene',
    listed: true,
    name: 'Charlene Mtetwa',
    short: 'Charlene M.',
    first: 'Charlene',
    initials: 'CM',
    photo: 'mentors/charlene.jpg',
    avatar: 'mentors/charlene-face.jpg',
    role: 'Secretary General at Enactus NUST',
    badge: 'Stride Verified Mentor',
    since: 'Harare, Zimbabwe',
    stats: [
      { value: 'NUST', label: 'studies at' },
      { value: 'Enactus', label: 'chapter' },
      { value: 'Harare', label: 'based in' }
    ],
    bio: [
      'Charlene is Secretary General of Enactus NUST, the student entrepreneurship chapter at the National University of Science and Technology in Harare.',
      'She works with students on community projects and new ventures, and on Stride she mentors teens who want to try entrepreneurship and technology.'
    ],
    parentNote:
      'I keep sessions practical and on time, and guardians can see what we worked on.',
    teaches: ['Entrepreneurship', 'Community projects', 'Presenting an idea', 'Teamwork'],
    checks: ['ID verified', 'Safeguarding training complete', 'Approved by Enactus NUST', 'References checked']
  },
  {
    id: 'eric',
    listed: true,
    name: 'Eric Khumalo',
    short: 'Eric K.',
    first: 'Eric',
    initials: 'EK',
    photo: 'mentors/eric.jpg',
    avatar: 'mentors/eric-face.jpg',
    role: 'Data science, education and software engineering',
    badge: 'Stride Verified Mentor',
    since: 'Berkeley, California',
    stats: [
      { value: 'EIT', label: 'works at' },
      { value: 'Berkeley', label: 'based in' },
      { value: 'Data', label: 'science' }
    ],
    bio: [
      'Eric works across data science, education and software engineering. He is with the Ellison Institute of Technology in Oxford, and studied at the University of California, Berkeley.',
      'On Stride he mentors teens who want to try data and software, and he keeps sessions practical and easy to follow.'
    ],
    parentNote:
      'I keep sessions practical and on time, and guardians can see what we worked on.',
    teaches: ['Data science', 'Software engineering', 'Learning how to learn', 'Problem solving'],
    checks: ['ID verified', 'Safeguarding training complete', 'References checked', 'Approved for Stride mentoring']
  }
];

// Club leaders. They have no photo yet, so their avatar falls back to initials.
function leader(id, name, clubName, title) {
  const [first, last] = name.split(' ');
  return {
    id,
    name,
    short: `${first} ${last[0]}.`,
    first,
    initials: `${first[0]}${last[0]}`,
    photo: null,
    avatar: null,
    role: `${title} at ${clubName}`,
    badge: 'Stride Verified Leader',
    since: 'Leading a club on Stride',
    stats: [
      { value: '3', label: 'checks passed' },
      { value: '1', label: 'club led' },
      { value: 'Weekly', label: 'sessions' }
    ],
    bio: [`${first} leads ${clubName} every week and confirms each session on Stride.`],
    parentNote: 'I confirm every session on Stride, so you always know your teen was there.',
    teaches: [clubName],
    checks: [`${title} ID checked`, 'Safeguarding training complete', 'Venue and first aid checked']
  };
}

mentors.push(
  leader('farai', 'Farai Mapfumo', 'Football Academy', 'Coach'),
  leader('ruvimbo', 'Ruvimbo Kanengoni', 'Robotics & AI', 'Mentor'),
  leader('blessing', 'Blessing Tendai', 'Vocational Training', 'Trainer'),
  leader('simba', 'Simba Dube', 'Chess and Debate Club', 'Coach'),
  leader('nyasha', 'Nyasha Phiri', 'Community Choir', 'Leader'),
  leader('chipo', 'Chipo Gumbo', 'Netball Club', 'Coach')
);

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const reportReasons = ['Something the mentor said', 'Something that felt unsafe', 'Something else'];
