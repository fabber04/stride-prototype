import { useState } from 'react';
import Status from '../components/Status.jsx';
import { useStore } from '../store.jsx';
import { explain } from '../api.js';
import { formatWhen } from '../onboarding.js';

export default function MentorHome() {
  const { org, confirmMentorTask, leaveFamily } = useStore();
  const [notice, setNotice] = useState('');

  const confirm = async (familyId, lessonId) => {
    setNotice('');
    try {
      await confirmMentorTask(familyId, lessonId);
    } catch (error) {
      setNotice(explain(error));
    }
  };

  if (!org) {
    return (
      <main className="page">
        <h1 className="h1">Mentor</h1>
        <p className="row-meta">Loading your teens…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">{org.mentorName}</h1>
        <p className="row-meta">{org.name}. You see teens this club has accepted, and only messages a guardian let through.</p>
      </header>
      {notice && <Status icon="lock">{notice}</Status>}

      <h2 className="section-title">Teens</h2>
      {org.teens.length === 0 && <p className="row-meta">No accepted teens yet.</p>}
      {org.teens.map((teen) => (
        <p className="row-title" key={teen.familyId}>
          {teen.name} · {teen.ageBand}
        </p>
      ))}

      <h2 className="section-title">Messages</h2>
      {org.messages.length === 0 && <p className="row-meta">No messages have been allowed through yet.</p>}
      {org.messages.map((item) => (
        <section className="panel stack-8" key={item.id}>
          <span className="row-title">{item.from}</span>
          <p className="body">{item.text}</p>
          <span className="row-meta">{formatWhen(item.at)}</span>
        </section>
      ))}

      <h2 className="section-title">Tasks waiting</h2>
      {org.tasks.length === 0 && <p className="row-meta">No tasks are waiting for you.</p>}
      {org.tasks.map((task) => (
        <section className="panel stack-8" key={`${task.familyId}-${task.lessonId}`}>
          <span className="row-title">{task.teenName}</span>
          <span className="row-meta">{task.title}</span>
          <button type="button" className="btn btn-primary" onClick={() => confirm(task.familyId, task.lessonId)}>
            Confirm this task
          </button>
        </section>
      ))}
      <p className="fine fine-left">Confirming a task records your name. It does not award a badge or share a school record.</p>

      <button type="button" className="link-btn" onClick={leaveFamily}>
        Leave this mentor phone
      </button>
    </main>
  );
}
