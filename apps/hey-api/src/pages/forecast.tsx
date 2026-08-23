import { type FormEvent, useState } from 'react';

import { getForecast } from '../api/generated/sdk.gen';
import type { Forecast } from '../api/generated/types.gen';

export function ForecastPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const city = String(data.get('city') ?? '').trim();
    const days = Number(data.get('days'));
    if (city.length < 2 || !Number.isInteger(days) || days < 1 || days > 5) {
      setError('Enter a city and choose between one and five days.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getForecast({ query: { city, days } });
      if (result.error || !result.data) {
        setError('The API rejected the forecast request.');
        return;
      }
      setForecast(result.data);
    } catch {
      setError('The API did not answer. Start the backend and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Typed query parameters</p>
          <h1>Route forecast</h1>
          <p className="page-deck">
            The city is required and the contract limits the horizon to five days.
          </p>
        </div>
      </header>

      <section className="forecast-console">
        <form className="forecast-form" onSubmit={handleSubmit}>
          <label>
            Destination city
            <input name="city" defaultValue="Rosario" minLength={2} maxLength={40} />
          </label>
          <label>
            Days
            <select name="days" defaultValue="3">
              {[1, 2, 3, 4, 5].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <button className="button button-primary" disabled={loading}>
            {loading ? 'Reading…' : 'Read forecast'}
          </button>
        </form>

        {error ? <div className="notice notice-error">{error}</div> : null}

        <div
          className={forecast ? 'forecast-strip' : 'forecast-strip forecast-strip-empty'}
          aria-live="polite"
        >
          {forecast ? (
            forecast.days.map((day) => (
              <article key={day.day}>
                <time>{day.day.slice(5)}</time>
                <span className="weather-glyph" aria-hidden="true" />
                <strong>{day.condition}</strong>
                <p>
                  {day.high_c}° <span>{day.low_c}°</span>
                </p>
              </article>
            ))
          ) : (
            <div className="forecast-empty">
              <span className="weather-glyph" aria-hidden="true" />
              <p>Choose a destination to call the typed forecast endpoint.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
