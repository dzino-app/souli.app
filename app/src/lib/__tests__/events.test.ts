import { describe, it, expect, beforeEach } from "bun:test";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getDiaryEvents,
  markEventDone,
} from "../events";

describe("events", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with no events", () => {
    expect(getEvents()).toEqual([]);
  });

  it("creates an event", () => {
    const event = createEvent({
      title: "Dentista",
      description: "Ročná prehliadka",
      date: "2026-04-15",
      time: "10:00",
      type: "plan",
      status: "upcoming",
      createdBy: "user",
    });
    expect(event.title).toBe("Dentista");
    expect(event.id).toBeTruthy();
    expect(getEvents()).toHaveLength(1);
  });

  it("updates an event", () => {
    const event = createEvent({
      title: "Test",
      description: "",
      date: "2026-04-01",
      type: "plan",
      status: "upcoming",
      createdBy: "user",
    });
    updateEvent(event.id, { title: "Updated" });
    expect(getEvents()[0].title).toBe("Updated");
  });

  it("deletes an event", () => {
    const event = createEvent({
      title: "Delete me",
      description: "",
      date: "2026-04-01",
      type: "plan",
      status: "upcoming",
      createdBy: "user",
    });
    deleteEvent(event.id);
    expect(getEvents()).toHaveLength(0);
  });

  it("filters upcoming events", () => {
    createEvent({
      title: "Future",
      description: "",
      date: "2099-01-01",
      type: "plan",
      status: "upcoming",
      createdBy: "user",
    });
    createEvent({
      title: "Past diary",
      description: "",
      date: "2020-01-01",
      type: "diary",
      status: "done",
      createdBy: "user",
    });
    expect(getUpcomingEvents()).toHaveLength(1);
    expect(getUpcomingEvents()[0].title).toBe("Future");
  });

  it("filters diary events", () => {
    createEvent({
      title: "Diary",
      description: "",
      date: "2026-03-01",
      type: "diary",
      status: "done",
      createdBy: "dzino",
    });
    expect(getDiaryEvents()).toHaveLength(1);
  });

  it("marks event as done", () => {
    const event = createEvent({
      title: "Do this",
      description: "",
      date: "2026-04-01",
      type: "plan",
      status: "upcoming",
      createdBy: "user",
    });
    markEventDone(event.id);
    expect(getEvents()[0].status).toBe("done");
  });
});
