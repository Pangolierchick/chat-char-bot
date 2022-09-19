import {RawSubscriber} from './types';
import {v4 as uuidv4} from 'uuid';

export class Subscriber {
  constructor(id: string, start: Date, end: Date, currentMeditationId=0) {
    this._id = id;
    this._start = start;
    this._end = end;

    this._currentMeditationId = currentMeditationId;
  }

  public get id(): string {
    return this._id;
  }
  public get start(): Date {
    return this._start;
  }
  public get end(): Date {
    return this._end;
  }
  public get currentMeditationId(): number {
    return this._currentMeditationId;
  }

  public updateDate(duration: number) {
    this._start = new Date();

    this._end = new Date();
    this._end.setMonth(this._end.getMonth() + duration);

    return this;
  }

  public raw() {
    return {
      id: this._id,
      start: this._start.getTime(),
      end: this._end.getTime(),
      currentMeditationId: this._currentMeditationId,
    };
  }

  public toString() {
    return `
            id: ${this._id}
            start: ${this.start.toISOString()}
            end: ${this.start.toISOString()}
            current meditation: ${this._currentMeditationId}
           `;
  }

  static fromRaw(raw: RawSubscriber) {
    return new Subscriber(raw.id, new Date(raw.start), new Date(raw.end), raw.currentMeditationId);
  }

  static fromToday(id: string, duration: number, currentMeditationId=0) {
    const today = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + duration);

    return new Subscriber(id, today, end, currentMeditationId);
  }

  static fromTodayNew(duration: number, currentMeditationId=0) {
    const today = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + duration);

    return new Subscriber(uuidv4(), today, end, currentMeditationId);
  }

  private _id: string;
  private _start: Date;
  private _end: Date;
  private _currentMeditationId: number;
}
