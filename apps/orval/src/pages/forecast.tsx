import { type FormEvent, useState } from 'react';

import { useGetForecast } from '../api/generated/dispatch-desk';
import type { GetForecastParams } from '../api/generated/models';

const idleParams: GetForecastParams = { city: 'Rosario', days: 3 };

export function ForecastPage() {
  const [params, setParams] = useState<GetForecastParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const forecastQuery = useGetForecast(params ?? idleParams, {
    query: { enabled: params !== null },
  });
  const forecast =
    forecastQuery.data?.status === 200 ? forecastQuery.data.data : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const city = String(data.get('city') ?? '').trim();
    const days = Number(data.get('days'));
    if (city.length < 2 || !Number.isInteger(days) || days < 1 || days > 5) {
      setError('Enter a city and choose between one and five days.');
      return;
    }
    setError(null);
    setParams({ city, days });
  };

  const queryError = forecastQuery.isError
    ? 'The API did not answer. Start the backend and try again.'
    : forecastQuery.data && forecastQuery.data.status !== 200
      ? 'The API rejected the forecast request.'
      : null;

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Query key includes typed parameters</p>
          <h1>Route forecast</h1>
          <p className="page-deck">
            Repeat a city and horizon to see TanStack Query reuse the cached result.
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
          <button className="button button-primary" disabled={forecastQuery.isFetching}>
            {forecastQuery.isFetching ? 'Reading…' : 'Read forecast'}
          </button>
        </form>

        {error || queryError ? (
          <div className="notice notice-error">{error ?? queryError}</div>
        ) : null}

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
              <p>Choose a destination to create the first forecast query.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
