import { useState } from 'react';
import { Icon } from '../../icons.jsx';
import NavBar from '../../components/NavBar.jsx';
import FieldError from '../../components/FieldError.jsx';
import { attempt, useBackend } from '../../api/index.jsx';
import { categories } from '../../data.js';
import { ledClubs } from '../../api/selectors.js';

export default function LessonEditor({ lesson }) {
  const { db, user, api } = useBackend();
  const clubs = ledClubs(db, user.mentorId);
  const [form, setForm] = useState(() => ({
    title: lesson?.title || '',
    type: lesson?.type || clubs[0]?.type || 'Tech',
    club: lesson ? lesson.club || null : clubs[0]?.id || null,
    minutes: lesson?.minutes || 5,
    videoUrl: lesson?.videoUrl || '',
    task: lesson?.task || '',
    steps: lesson ? [...lesson.steps] : ['', '', ''],
    badge: lesson?.badge || ''
  }));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setStep = (i, value) => update({ steps: form.steps.map((s, j) => (j === i ? value : s)) });
  const own = !lesson || lesson.mentorId === user.mentorId;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    let id;
    const message = await attempt((async () => (id = await api.saveLesson({ ...form, id: lesson?.id })))());
    setBusy(false);
    if (message) setError(message);
    else window.location.hash = `#/lesson/${id}`;
  };

  const remove = async () => {
    const message = await attempt(api.deleteLesson(lesson.id));
    if (message) setError(message);
    else window.location.hash = '#/lessons';
  };

  if (!own) {
    return (
      <main className="page">
        <NavBar title="Edit lesson" back="#/lessons" />
        <p className="body-muted">You can only edit your own lessons.</p>
      </main>
    );
  }

  return (
    <form className="detail" onSubmit={save}>
      <main className="page">
        <NavBar title={lesson ? 'Edit lesson' : 'New lesson'} back={lesson ? `#/lesson/${lesson.id}` : '#/lessons'} />

        <label className="stack-8">
          <span className="field-label">Title</span>
          <input className="input" value={form.title} maxLength={80} onChange={(e) => update({ title: e.target.value })} />
        </label>

        <div className="stack-8" role="group" aria-label="Category">
          <span className="field-label">Category</span>
          <div className="wrap-chips">
            {categories.map((c) => (
              <button key={c.id} type="button" className={form.type === c.id ? 'chip is-on' : 'chip'} aria-pressed={form.type === c.id} onClick={() => update({ type: c.id })}>
                {c.id}
              </button>
            ))}
          </div>
        </div>

        <div className="stack-8" role="group" aria-label="Linked club">
          <span className="field-label">Linked club</span>
          <div className="wrap-chips">
            {clubs.map((c) => (
              <button key={c.id} type="button" className={form.club === c.id ? 'chip is-on' : 'chip'} aria-pressed={form.club === c.id} onClick={() => update({ club: c.id })}>
                {c.shortName || c.name}
              </button>
            ))}
            <button type="button" className={!form.club ? 'chip is-on' : 'chip'} aria-pressed={!form.club} onClick={() => update({ club: null })}>
              None
            </button>
          </div>
        </div>

        <div className="row-12">
          <label className="stack-8">
            <span className="field-label">Minutes</span>
            <input className="input pin-field" type="number" min={1} max={60} value={form.minutes} onChange={(e) => update({ minutes: e.target.value })} />
          </label>
          <label className="stack-8 grow">
            <span className="field-label">Video link</span>
            <input className="input" type="url" inputMode="url" placeholder="https://" value={form.videoUrl} onChange={(e) => update({ videoUrl: e.target.value })} />
          </label>
        </div>

        <label className="stack-8">
          <span className="field-label">Offline task</span>
          <textarea className="textarea" rows="2" value={form.task} onChange={(e) => update({ task: e.target.value })} />
        </label>

        <div className="stack-8" role="group" aria-label="Steps">
          <span className="field-label">Steps</span>
          {form.steps.map((step, i) => (
            <div className="row-8" key={i}>
              <input className="input" aria-label={`Step ${i + 1}`} placeholder={`Step ${i + 1}`} value={step} onChange={(e) => setStep(i, e.target.value)} />
              {form.steps.length > 1 && (
                <button type="button" className="icon-btn" aria-label={`Remove step ${i + 1}`} onClick={() => update({ steps: form.steps.filter((_, j) => j !== i) })}>
                  <Icon name="x" size={18} />
                </button>
              )}
            </div>
          ))}
          {form.steps.length < 6 && (
            <button type="button" className="link-btn end" onClick={() => update({ steps: [...form.steps, ''] })}>
              Add a step
            </button>
          )}
        </div>

        <label className="stack-8">
          <span className="field-label">Badge name</span>
          <input className="input" maxLength={30} placeholder="For example: Builder" value={form.badge} onChange={(e) => update({ badge: e.target.value })} />
        </label>

        {lesson &&
          (!removing ? (
            <button type="button" className="btn btn-danger-outline" onClick={() => setRemoving(true)}>
              Remove lesson
            </button>
          ) : (
            <section className="panel stack-12" aria-label="Remove lesson">
              <p className="body">Remove this lesson? Badges teens already earned stay on their record.</p>
              <div className="row-8">
                <button type="button" className="btn btn-danger grow" onClick={remove}>
                  Remove
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setRemoving(false)}>
                  Cancel
                </button>
              </div>
            </section>
          ))}
        <FieldError>{error}</FieldError>
      </main>

      <div className="detail-footer">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {lesson ? 'Save changes' : 'Publish lesson'}
        </button>
      </div>
    </form>
  );
}
