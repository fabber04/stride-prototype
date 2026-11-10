import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import FieldError from '../components/FieldError.jsx';
import WeekPlan from '../components/WeekPlan.jsx';
import { useStore } from '../store.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { clubParents } from '../data.js';
import {
  attendanceFor, badgesFor, clubIdsOf, requestsFor, selectedTeen, sessionsThisWeek, tasksFor, teensOf, thread, threads
} from '../api/selectors.js';
import { addDays, formatDay, formatShort, isoDate, weekKey } from '../api/dates.js';

function initials(name) {
  return name.replace(/'s .*/, '').slice(0, 2).toUpperCase();
}

function RequestCard({ db, kid, request, api }) {
  const [error, setError] = useState(null);
  const club = db.clubs[request.clubId];
  const decide = async (decision) => setError(await attempt(api.decideRequest(request.id, decision)));
  return (
    <section className="panel" aria-label={`${kid.name} wants to join ${club.name}`}>
      <div className="row-item">
        <Cover type={club.type} size="sm" photo={club.id} />
        <div className="stack-2 grow">
          <span className="row-title">
            {kid.name} wants to join {club.name}
          </span>
          <span className="row-meta">
            {club.short} · {club.lead}
          </span>
        </div>
      </div>
      {request.status === 'pending' ? (
        <div className="row-12">
          <button type="button" className="btn btn-ghost grow" onClick={() => decide('declined')}>
            Not now
          </button>
          <button type="button" className="btn btn-primary grow" onClick={() => decide('approved')}>
            Approve
          </button>
        </div>
      ) : (
        <div className="stack-2">
          <Status icon={request.status === 'approved' ? 'checkCircle' : 'clock'}>
            {request.status === 'approved'
              ? `Approved. ${kid.name} can join ${club.name} from ${club.when.split(',')[0].replace(/s$/, '')}.`
              : `Not now. ${kid.name} is told you said no for now.`}
          </Status>
          <button type="button" className="link-btn" onClick={() => decide('pending')}>
            Change my answer
          </button>
        </div>
      )}
      <FieldError>{error}</FieldError>
    </section>
  );
}

export default function Guardian() {
  const { state, set } = useStore();
  const { db, user, api } = useBackend();
  const teens = teensOf(db, user.id);
  const kid = selectedTeen(db, user.id, state.child);
  // Remember who is shown, so answering their request doesn't jump to another teen.
  useEffect(() => {
    if (kid && state.child !== kid.id) set({ child: kid.id });
  }, [kid?.id]);
  const startAdd = () => set({ setup: { mode: 'addTeen' } });

  if (!kid) {
    return (
      <main className="page">
        <header className="title-block">
          <h1 className="h1">Hi, {user.name.split(' ')[0]}</h1>
          <p className="body-muted">Add your teen to open their account. You choose what they can use.</p>
        </header>
        <button type="button" className="btn btn-primary" onClick={startAdd}>
          <Icon name="plus" size={18} strokeWidth={2} />
          Add a teen
        </button>
      </main>
    );
  }

  const now = new Date();
  const thisWeek = weekKey(now);
  const goal = kid.goal || 2;
  const confirmed = sessionsThisWeek(db, kid.id, now);
  const sessions = attendanceFor(db, kid.id).filter((a) => a.date >= isoDate(addDays(now, -7))); // the last 7 days
  const mentorMessages = threads(db, { teenId: kid.id }, 'guardian')
    .flatMap((t) => thread(db, t.teenId, t.mentorId))
    .filter((m) => m.from === 'mentor' && weekKey(new Date(m.at)) === thisWeek).length;
  const requests = requestsFor(db, kid.id).filter((r) => r.status === 'pending' || (r.decidedAt && now - new Date(r.decidedAt) < 7 * 86400000));
  const waitingTasks = tasksFor(db, kid.id).filter((t) => t.status === 'submitted' && db.lessons[t.lessonId]);
  const recentBadges = badgesFor(db, kid.id).slice(0, 3);
  const clubIds = clubIdsOf(db, kid.id).filter((id) => clubParents[id]);
  const toggleGroup = (id) => set((prev) => ({ parentGroups: { ...prev.parentGroups, [id]: !prev.parentGroups[id] } }));
  const pendingCount = requestsFor(db, kid.id).filter((r) => r.status === 'pending').length;

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/clubs" aria-label="Find a club">
            <Icon name="search" size={20} strokeWidth={1.8} />
          </a>
          <a href="#/guardian/controls" aria-label="Controls and permissions">
            <Icon name="sliders" size={19} strokeWidth={1.8} />
          </a>
        </div>
      </div>

      {kid.paused && (
        <a href="#/guardian/controls">
          <Status icon="lock">{kid.name}'s account is paused. Tap to change.</Status>
        </a>
      )}

      <header className="title-block">
        <h1 className="h1">Week plan</h1>
        <div className="subline">
          <span>
            <strong>{user.name.split(' ')[0]}</strong> · {teens.length} {teens.length === 1 ? 'teen' : 'teens'}
          </span>
          <span>This week</span>
        </div>
      </header>

      <WeekPlan db={db} teens={teens} />

      <div className="chips" role="group" aria-label="Choose a teen">
        {teens.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === kid.id ? 'chip chip-dark is-on' : 'chip chip-dark'}
            aria-pressed={t.id === kid.id}
            onClick={() => set({ child: t.id })}
          >
            <span className="kid-dot" style={{ background: t.color }} aria-hidden="true" />
            {t.name}
          </button>
        ))}
        <button type="button" className="chip" aria-label="Add a teen" onClick={startAdd}>
          <Icon name="plus" size={16} strokeWidth={2} />
        </button>
      </div>

      <section className="hero" aria-label="Confirmed sessions">
        <span className="hero-eyebrow">Confirmed by club leaders</span>
        <span className="hero-stat">
          <strong className="num">{confirmed}</strong> of {goal} sessions
        </span>
        <div className="segments" role="progressbar" aria-label="Confirmed sessions" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={confirmed}>
          {Array.from({ length: goal }, (_, i) => (
            <span key={i} className={i < confirmed ? 'is-done' : undefined} />
          ))}
        </div>
        <span className="hero-small">
          {mentorMessages === 0
            ? 'No messages from mentors this week.'
            : `${mentorMessages} ${mentorMessages === 1 ? 'message' : 'messages'} from a mentor this week.`}{' '}
          <a className="see-all" href="#/messages">
            Read
          </a>
        </span>
      </section>

      {requests.length > 0 && (
        <>
          <SectionHead title={pendingCount > 0 ? 'Waiting for you' : 'Your answers'} />
          {requests.filter((r) => db.clubs[r.clubId]).map((r) => (
            <RequestCard key={r.id} db={db} kid={kid} request={r} api={api} />
          ))}
        </>
      )}

      <SectionHead title={`Latest from ${kid.name}`} />
      <section className="panel panel-list" aria-label={`Latest from ${kid.name}`}>
        {sessions.slice(0, 4).map((a) => {
          const club = db.clubs[a.clubId];
          const by = db.mentors[a.confirmedBy];
          return (
            <div className="club-line" key={a.id}>
              <span className="check-dot" aria-hidden="true">
                <Icon name="check" size={16} strokeWidth={2} />
              </span>
              <div className="stack-2">
                <span className="row-title">{club?.name}</span>
                <span className="row-meta">
                  {formatDay(a.date)}, confirmed by {by ? by.short : 'the leader'}
                </span>
              </div>
            </div>
          );
        })}
        {waitingTasks.map((t) => {
          const lesson = db.lessons[t.lessonId];
          return (
            <div className="club-line" key={t.id}>
              <span className="lock-dot" aria-hidden="true">
                <Icon name="clock" size={15} strokeWidth={2} />
              </span>
              <div className="stack-2">
                <span className="row-title">{lesson.title}</span>
                <span className="row-meta">Task sent. Waiting for {lesson.by} to confirm.</span>
              </div>
            </div>
          );
        })}
        {recentBadges.map((b) => (
          <div className="club-line" key={b.id}>
            <span className="check-dot" aria-hidden="true">
              <Icon name="award" size={16} strokeWidth={2} />
            </span>
            <div className="stack-2">
              <span className="row-title">{b.name} badge</span>
              <span className="row-meta">
                {formatShort(b.at)} · signed off by {db.mentors[b.mentorId]?.short || 'a mentor'}
              </span>
            </div>
          </div>
        ))}
        {sessions.length === 0 && waitingTasks.length === 0 && recentBadges.length === 0 && (
          <p className="row-meta empty">Nothing confirmed yet this week.</p>
        )}
      </section>

      {clubIds.length > 0 && (
        <>
          <SectionHead title="Other parents at these clubs" />
          <section className="panel panel-list" aria-label="Other parents">
            {clubIds.map((id) => {
              const club = db.clubs[id];
              const parents = clubParents[id];
              const joined = !!state.parentGroups[id];
              return (
                <div className="parents-line" key={id}>
                  <span className="faces" aria-hidden="true">
                    {parents.names.map((name) => (
                      <span key={name} className="face">
                        {initials(name)}
                      </span>
                    ))}
                    <span className="face face-more">+{parents.count - parents.names.length}</span>
                  </span>
                  <span className="stack-2 grow">
                    <span className="row-title">{club.name}</span>
                    <span className="row-meta">
                      {parents.names.join(', ')} and {parents.count - parents.names.length} other families
                    </span>
                  </span>
                  <button
                    type="button"
                    className={joined ? 'chip is-on' : 'chip'}
                    aria-pressed={joined}
                    aria-label={joined ? `Leave the ${club.name} parents' WhatsApp group` : `Join the ${club.name} parents' WhatsApp group`}
                    onClick={() => toggleGroup(id)}
                  >
                    {joined ? 'Joined' : 'Join group'}
                  </button>
                </div>
              );
            })}
          </section>
          <p className="fine fine-left">Parents who know each other keep a closer eye out. Groups run on WhatsApp and the club leader is in each one.</p>
        </>
      )}

      {kid.consent.summary ? (
        <>
          <SectionHead title="Weekly summary on WhatsApp" />
          <div className="summary-preview" aria-label="Summary preview">
            <p>
              <strong>Stride · {kid.name}'s week</strong>
            </p>
            <p>
              {confirmed} of {goal} sessions confirmed by club leaders.
            </p>
            {pendingCount > 0 && (
              <p>
                {pendingCount} club {pendingCount === 1 ? 'request is' : 'requests are'} waiting for you.
              </p>
            )}
            {recentBadges[0] && <p>Latest badge: {recentBadges[0].name}.</p>}
            <p>
              {mentorMessages} {mentorMessages === 1 ? 'message' : 'messages'} from a mentor.
            </p>
            <span className="bubble-time">Sundays, 6 pm</span>
          </div>
          {!state.summarySent ? (
            <button type="button" className="btn btn-ghost" onClick={() => set({ summarySent: true })}>
              <Icon name="send" size={18} strokeWidth={1.6} />
              Send it now
            </button>
          ) : (
            <Status>Weekly summary sent on WhatsApp.</Status>
          )}
        </>
      ) : (
        <p className="fine fine-left">The weekly WhatsApp summary is off. Turn it on in Controls.</p>
      )}
    </main>
  );
}

