import { useState } from 'react';
import { Icon } from '../icons.jsx';
import Cover from '../components/Cover.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import WeekPlan from '../components/WeekPlan.jsx';
import { useStore } from '../store.jsx';
import { clubById, clubParents, clubs, lessons, mentorById } from '../data.js';
import { explain } from '../api.js';
import { formatWhen } from '../onboarding.js';
import { activeChildId, childSummary, consentOf, family, isActiveTeen, teenProfile, weekRows } from '../teen.js';

function initials(name) {
  return name
    .replace(/'s .*/, '')
    .slice(0, 2)
    .toUpperCase();
}

export default function Guardian() {
  const { state, set, session, decideClub, releaseMessage, updateSettings, inviteFor } = useStore();
  const [notice, setNotice] = useState('');
  const [leaderCodes, setLeaderCodes] = useState({});
  const kids = family(state);
  const childId = activeChildId(state);
  const kid = kids.find((c) => c.id === childId);
  const data = childSummary(state, childId);
  const teen = teenProfile(state);
  const showTeen = isActiveTeen(state);
  const consent = consentOf(state);
  const requests = showTeen ? clubs.filter((club) => state.requested[club.id]) : [];
  const live = !!session;
  const decide = async (id, decision) => {
    if (!live) {
      set((prev) => ({ decisions: { ...prev.decisions, [id]: decision } }));
      return;
    }
    try {
      await decideClub(id, decision);
    } catch (error) {
      setNotice(explain(error));
    }
  };
  const toggleGroup = async (id) => {
    const next = { ...state.parentGroups, [id]: !state.parentGroups[id] };
    if (!live) {
      set({ parentGroups: next });
      return;
    }
    try {
      await updateSettings({ parentGroups: next });
    } catch (error) {
      setNotice(explain(error));
    }
  };
  const markSummary = async (on) => {
    if (!live) {
      set({ summarySent: on });
      return;
    }
    try {
      await updateSettings({ summarySent: on });
    } catch (error) {
      setNotice(explain(error));
    }
  };
  const messages = [...(state.messages || [])].reverse();
  const reports = [...(state.reports || [])].reverse();
  const pendingLessons = lessons.filter((lesson) => state.taskDone[lesson.id]);
  const setMessageStatus = async (id, status) => {
    if (!live) {
      set((prev) => ({ messages: prev.messages.map((item) => (item.id === id ? { ...item, status } : item)) }));
      return;
    }
    try {
      await releaseMessage(id, status);
    } catch (error) {
      setNotice(explain(error));
    }
  };
  const leaderCode = async (clubId) => {
    try {
      const result = await inviteFor('leader', clubId);
      setLeaderCodes((prev) => ({ ...prev, [clubId]: result.invite }));
    } catch (error) {
      setNotice(explain(error));
    }
  };

  return (
    <main className="page">
      <div className="toolbar-row">
        <div className="toolbar">
          <a href="#/clubs" aria-label="Find a club">
            <Icon name="search" size={20} strokeWidth={1.8} />
          </a>
          {consent.summary !== false && (
            <button type="button" aria-label="Mark a weekly summary" onClick={() => markSummary(true)}>
              <Icon name="send" size={19} strokeWidth={1.8} />
            </button>
          )}
          <a href="#/guardian/controls" aria-label="Controls and permissions">
            <Icon name="sliders" size={19} strokeWidth={1.8} />
          </a>
        </div>
      </div>

      {state.paused && (
        <a href="#/guardian/controls">
          <Status icon="lock">{teen.name}'s account is paused. Tap to change.</Status>
        </a>
      )}

      {notice && <Status icon="lock">{notice}</Status>}
      {session?.role === 'guardian' && session.invites?.teen && (
        <Status icon="shield">
          Teen code <span className="family-code family-code-inline">{session.invites.teen.code}</span>. It works once, before{' '}
          {formatWhen(session.invites.teen.expiresAt)}.
          <button type="button" className="link-btn" onClick={() => inviteFor('teen').catch((error) => setNotice(explain(error)))}>
            New code
          </button>
        </Status>
      )}

      <header className="title-block">
        <h1 className="h1">Week plan</h1>
        <div className="subline">
          <span>
            <strong>Guardian view</strong> · {kids.length} {kids.length === 1 ? 'child' : 'children'}
          </span>
          <span>This week</span>
        </div>
      </header>

      <WeekPlan rows={weekRows(state)} />

      {kids.length > 1 && (
        <div className="chips" role="group" aria-label="Choose a child">
          {kids.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === childId ? 'chip chip-dark is-on' : 'chip chip-dark'}
              aria-pressed={c.id === childId}
              onClick={() => set({ child: c.id })}
            >
              <span className="kid-dot" style={{ background: c.color }} aria-hidden="true" />
              {c.label}
            </button>
          ))}
        </div>
      )}

      <section className="hero" aria-label="Confirmed sessions">
        <span className="hero-eyebrow">Confirmed by coaches</span>
        <span className="hero-stat">
          <strong className="num">{data.confirmed}</strong> of {data.goal} sessions
        </span>
        <div className="segments" role="progressbar" aria-label="Confirmed sessions" aria-valuemin={0} aria-valuemax={data.goal} aria-valuenow={data.confirmed}>
          {Array.from({ length: data.goal }, (_, i) => (
            <span key={i} className={i < data.confirmed ? 'is-done' : undefined} />
          ))}
        </div>
        <span className="hero-small">{data.message}</span>
      </section>

      {requests.length > 0 && (
        <>
          <SectionHead title="Waiting for you" />
          {requests.map((club) => {
            const decision = state.decisions[club.id];
            return (
              <section className="panel" key={club.id} aria-label={`${kid.label} wants to join ${club.name}`}>
                <div className="row-item">
                  <Cover type={club.type} size="sm" photo={club.id} />
                  <div className="stack-2 grow">
                    <span className="row-title">
                      {kid.label} wants to join {club.name}
                    </span>
                    <span className="row-meta">
                      {club.short} · {club.lead}
                    </span>
                  </div>
                </div>
                {!decision ? (
                  <div className="row-12">
                    <button type="button" className="btn btn-ghost grow" onClick={() => decide(club.id, 'declined')}>
                      Not now
                    </button>
                    <button type="button" className="btn btn-primary grow" onClick={() => decide(club.id, 'approved')}>
                      Approve
                    </button>
                  </div>
                ) : (
                  <div className="stack-2">
                    <Status>
                      {decision === 'approved'
                        ? `Approved. ${kid.label} can join ${club.name} from ${club.when.split(',')[0].replace(/s$/, '')}.`
                        : `Not now. ${kid.label} is told you said no for now.`}
                    </Status>
                    {session?.role === 'guardian' && decision === 'approved' && (
                      <button type="button" className="link-btn" onClick={() => leaderCode(club.id)}>
                        Code for the club leader
                      </button>
                    )}
                    {leaderCodes[club.id] && (
                      <p className="family-code">{leaderCodes[club.id].code}</p>
                    )}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => decide(club.id, live ? (decision === 'approved' ? 'declined' : 'approved') : undefined)}
                    >
                      Change my answer
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      {showTeen && <SectionHead title={`${teen.name}'s messages`} />}
      {showTeen && messages.length === 0 && (
        <p className="row-meta">No messages yet. When {teen.name} writes to a mentor, it stays here for you to read.</p>
      )}
      {showTeen && messages.length > 0 && (
        <section className="panel panel-list" aria-label={`${teen.name}'s messages`}>
          {messages.map((item) => {
            const person = mentorById[item.to];
            return (
              <div className="message-line" key={item.id}>
                <div className="stack-2 grow">
                  <span className="row-title">To {person?.first || 'a mentor'}</span>
                  <span className="body">{item.text}</span>
                  <span className="row-meta">
                    {item.status === 'held' && `Held · ${item.flag}`}
                    {item.status === 'blocked' && 'You stopped this. The mentor did not see it.'}
                    {item.status === 'sent' &&
                      (item.releasedBy ? `Allowed by ${item.releasedBy}` : 'Sent · you can read it')}
                    {' · '}
                    {formatWhen(item.at)}
                  </span>
                  {item.status === 'held' && (
                    <div className="row-8">
                      <button type="button" className="btn btn-primary" onClick={() => setMessageStatus(item.id, 'sent')}>
                        Allow
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setMessageStatus(item.id, 'blocked')}>
                        Don't send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {showTeen && pendingLessons.length > 0 && (
        <>
          <SectionHead title="Waiting for a coach" />
          <section className="panel panel-list" aria-label="Lessons waiting for confirmation">
            {pendingLessons.map((lesson) => (
              <div className="club-line" key={lesson.id}>
                <span className="check-dot" aria-hidden="true">
                  <Icon name="clock" size={16} strokeWidth={2} />
                </span>
                <div className="stack-2">
                  <span className="row-title">{lesson.badge}</span>
                  <span className="row-meta">
                    {teen.name} finished "{lesson.title}". {lesson.by} still needs to confirm it.
                  </span>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {showTeen && state.recordShared && (
        <>
          <SectionHead title="Growth record" />
          <Status>
            {teen.name} asked to share their growth record with a school. The link shows confirmed entries only.
          </Status>
        </>
      )}

      {showTeen && reports.length > 0 && (
        <>
          <SectionHead title="Safeguarding reports" />
          <section className="panel panel-list" aria-label="Safeguarding reports">
            {reports.map((item) => (
              <div className="club-line" key={item.id}>
                <span className="check-dot" aria-hidden="true">
                  <Icon name="flag" size={16} strokeWidth={2} />
                </span>
                <div className="stack-2">
                  <span className="row-title">{item.reason}</span>
                  <span className="row-meta">
                    {item.by} · {item.status} · {formatWhen(item.at)}
                  </span>
                </div>
              </div>
            ))}
          </section>
          <p className="fine fine-left">The mentor cannot read these. They are queued here. A person is not notified until a safeguarding queue is connected.</p>
        </>
      )}

      <SectionHead title="Confirmed sessions" />
      <section className="panel panel-list" aria-label="Confirmed sessions">
        {data.sessions.length === 0 && (
          <p className="row-meta">No sessions yet. When you approve a club, it is listed here until the coach confirms attendance.</p>
        )}
        {data.sessions.map((session) => (
          <div className="club-line" key={session.name}>
            <span className="check-dot" aria-hidden="true">
              <Icon name="check" size={16} strokeWidth={2} />
            </span>
            <div className="stack-2">
              <span className="row-title">{session.name}</span>
              <span className="row-meta">{session.detail}</span>
            </div>
          </div>
        ))}
      </section>

      <SectionHead title="Other parents at these clubs" />
      <section className="panel panel-list" aria-label="Other parents">
        {data.clubs.length === 0 && (
          <p className="row-meta">No clubs yet. An approved club shows the other parents here.</p>
        )}
        {data.clubs.map((id) => {
          const club = clubById[id];
          const parents = clubParents[id];
          const joined = !!state.parentGroups[id];
          if (!parents) {
            return (
              <div className="parents-line" key={id}>
                <span className="stack-2 grow">
                  <span className="row-title">{club.name}</span>
                  <span className="row-meta">Other families show up here once a few parents are on Stride.</span>
                </span>
              </div>
            );
          }
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
      <p className="fine fine-left">WhatsApp is not connected. Joining only saves that you want the group.</p>

      {consent.summary === false ? (
        <Status icon="lock">Weekly WhatsApp summaries are off. Turn them on in Controls.</Status>
      ) : !state.summarySent ? (
        <button type="button" className="btn btn-ghost" onClick={() => markSummary(true)}>
          <Icon name="send" size={18} strokeWidth={1.6} />
          Mark a weekly summary
        </button>
      ) : (
        <div className="stack-2">
          <Status>Summary marked for you. WhatsApp is not connected, so nothing was sent.</Status>
          <button type="button" className="link-btn" onClick={() => markSummary(false)}>
            Clear the mark
          </button>
        </div>
      )}
    </main>
  );
}
