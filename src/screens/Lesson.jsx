import { useState } from 'react';
import { Icon, PauseFill, PlayFill } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import Status from '../components/Status.jsx';
import FieldError from '../components/FieldError.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { useStore } from '../store.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { lessonMentor, taskFor } from '../api/selectors.js';

const isVideoFile = (url) => /\.(mp4|webm)(\?.*)?$/i.test(url || '');
const backFor = { teen: '#/learn', guardian: '#/guardian', mentor: '#/lessons' };

function Video({ lesson, saved, playing, onToggle, onSave }) {
  if (isVideoFile(lesson.videoUrl)) {
    return (
      <section className="video" aria-label="Lesson video">
        <video className="video-poster" src={lesson.videoUrl} poster={lesson.image || undefined} controls playsInline preload="metadata" />
      </section>
    );
  }
  const elapsed = Math.round(lesson.minutes * 0.4);
  return (
    <section className="video" aria-label="Lesson video">
      {lesson.image ? <img className="video-poster" src={lesson.image} alt="" draggable="false" /> : <span className="video-poster" />}
      {lesson.size &&
        (saved ? (
          <span className="video-chip">
            <Icon name="check" size={14} strokeWidth={2.4} />
            Saved offline
          </span>
        ) : (
          <button type="button" className="video-chip" onClick={onSave}>
            <Icon name="download" size={14} strokeWidth={2.4} />
            Download {lesson.size}
          </button>
        ))}
      {lesson.videoUrl ? (
        <a className="video-play" href={lesson.videoUrl} target="_blank" rel="noreferrer" aria-label="Play lesson video">
          <PlayFill size={26} />
        </a>
      ) : (
        <button type="button" className="video-play" aria-label={playing ? 'Pause lesson' : 'Play lesson'} onClick={onToggle}>
          {playing ? <PauseFill size={26} /> : <PlayFill size={26} />}
        </button>
      )}
      <div className="video-bar">
        <span className="num">{elapsed}:00</span>
        <div className="progress grow">
          <span style={{ width: `${(elapsed / lesson.minutes) * 100}%` }} />
        </div>
        <span className="num">{lesson.minutes}:00</span>
      </div>
    </section>
  );
}

export default function Lesson({ lesson }) {
  const { state, set } = useStore();
  const { db, user, api } = useBackend();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const isTeen = user.role === 'teen';
  const mentor = lessonMentor(db, lesson);
  const first = mentor?.first || lesson.by.split(' ')[0];
  const club = db.clubs[lesson.club];
  const task = isTeen ? taskFor(db, user.id, lesson.id) : null;
  const status = task?.status || 'draft';
  const ticked = task?.steps || {};
  const tickedCount = lesson.steps.filter((_, i) => ticked[i]).length;
  const ready = tickedCount === lesson.steps.length;
  const locked = !isTeen || ['submitted', 'confirmed'].includes(status) || user.paused;
  const toggle = (key) => set((prev) => ({ [key]: { ...prev[key], [lesson.id]: !prev[key][lesson.id] } }));

  const run = async (promise) => {
    setBusy(true);
    setError(await attempt(promise));
    setBusy(false);
  };
  const toggleStep = (i) => run(api.saveSteps(lesson.id, { ...ticked, [i]: !ticked[i] }));

  return (
    <div className="detail">
      <main className="page">
        <NavBar title={lesson.type} back={backFor[user.role]} />

        <Video lesson={lesson} saved={!!state.saved[lesson.id]} playing={!!state.playing[lesson.id]} onToggle={() => toggle('playing')} onSave={() => toggle('saved')} />

        <div className="stack-8">
          <span className="tag tag-blue">
            <Icon name="award" size={12} strokeWidth={2.2} />
            Earns the {lesson.badge} badge
          </span>
          <h2 className="h1 h1-detail">{lesson.title}</h2>
          <span className="row-meta">
            {lesson.minutes} min{lesson.size ? ` · ${lesson.size} ${state.saved[lesson.id] ? 'on this phone' : 'to download'}` : ''}
          </span>
        </div>

        <a className="confirmer" href={mentor ? `#/mentor/${mentor.id}` : undefined}>
          <MentorAvatar size="md" person={mentor || { name: lesson.by }} />
          <span className="stack-2 grow">
            <span className="row-title">{lesson.by} confirms your task</span>
            <span className="row-meta">{club ? club.name : lesson.from}</span>
          </span>
          <Icon name="shield" size={20} strokeWidth={1.8} color="var(--accent)" />
        </a>

        {status === 'returned' && task.note && (
          <section className="callout callout-warn" aria-label={`Note from ${first}`}>
            <Icon name="message" size={20} strokeWidth={1.6} />
            <p>
              <strong>{first} sent it back:</strong> “{task.note}” Change what they asked, then send it again.
            </p>
          </section>
        )}

        <section className="panel" aria-label="Your offline task">
          <div className="panel-head">
            <h3 className="section-title">{isTeen ? 'Your offline task' : 'Offline task'}</h3>
            {isTeen && (
              <span className="row-meta num">
                {tickedCount} of {lesson.steps.length}
              </span>
            )}
          </div>
          <p className="body-muted">{lesson.task}</p>
          <ul className="steps">
            {lesson.steps.map((step, i) => (
              <li key={`${i}-${step}`}>
                <button
                  type="button"
                  className={ticked[i] ? 'step is-done' : 'step'}
                  aria-pressed={!!ticked[i]}
                  onClick={() => toggleStep(i)}
                  disabled={locked || busy}
                >
                  <span className="step-box" aria-hidden="true">
                    {ticked[i] && <Icon name="check" size={14} strokeWidth={3} />}
                  </span>
                  {step}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <FieldError>{error}</FieldError>
      </main>

      <div className="detail-footer">
        {!isTeen ? (
          user.role === 'mentor' && lesson.mentorId === user.mentorId ? (
            <a className="btn btn-primary" href={`#/lessons/${lesson.id}/edit`}>
              Edit lesson
            </a>
          ) : (
            <p className="fine">Preview. Teens tick off the steps and send the task to {first}.</p>
          )
        ) : status === 'confirmed' ? (
          <Status>{first} confirmed it. The {lesson.badge} badge is on your record.</Status>
        ) : status === 'submitted' ? (
          <div className="stack-2">
            <Status icon="clock">
              {lesson.by} has your task now. The {lesson.badge} badge goes on your record once they confirm it.
            </Status>
            <button type="button" className="link-btn" disabled={busy} onClick={() => run(api.withdrawTask(lesson.id))}>
              Take it back
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => run(api.submitTask(lesson.id))} disabled={!ready || busy || user.paused}>
            {user.paused ? 'Your account is paused' : ready ? `Send to ${first} to confirm` : 'Tick off the steps to finish'}
          </button>
        )}
      </div>
    </div>
  );
}
