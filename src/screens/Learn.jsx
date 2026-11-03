import { Icon, PlayFill } from '../icons.jsx';
import { useStore } from '../store.jsx';
import { lessons } from '../data.js';

export default function Learn() {
  const { state, set } = useStore();

  const toggle = (key, id) =>
    set((prev) => ({ [key]: { ...prev[key], [id]: !prev[key][id] } }));

  return (
    <main className="page">
      <header className="stack-12">
        <h1 className="h1">Lessons from mentors</h1>
        <div className="banner">
          <Icon name="wifi" size={20} color="var(--blue)" />
          <span>Data saver is on. Download lessons on club Wi-Fi and watch them anywhere.</span>
        </div>
      </header>

      <div className="stack-12">
        {lessons.map((lesson) => {
          const saved = !!state.saved[lesson.id];
          const playing = !!state.playing[lesson.id];
          return (
            <article className="card" key={lesson.id}>
              <div className="stack-4">
                <span className="label">{lesson.meta}</span>
                <h2 className="card-title">{lesson.title}</h2>
              </div>
              <div className="task">
                <strong>Offline task.</strong> {lesson.task}
              </div>
              <p className="small muted">{lesson.reward}</p>
              {saved ? (
                <div className="stack-8">
                  <div className="row-8">
                    <button type="button" className="btn btn-primary grow" onClick={() => toggle('playing', lesson.id)}>
                      <PlayFill />
                      Play without data
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={`Remove download of ${lesson.title}`}
                      onClick={() => toggle('saved', lesson.id)}
                    >
                      Remove
                    </button>
                  </div>
                  {playing && (
                    <div className="status" role="status">
                      Playing from this phone. No data used.
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => toggle('saved', lesson.id)}>
                  Download {lesson.size}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="note">
        <Icon name="refresh" size={20} color="var(--blue)" />
        <span>Progress is saved on this phone and syncs the next time you have a connection.</span>
      </div>
    </main>
  );
}
