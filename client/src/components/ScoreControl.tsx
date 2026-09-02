/** Scientific Ether: scoring is tactile, discrete, and legible under blinded review. */
export function ScoreControl({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description: string;
}) {
  return (
    <fieldset className="score-control">
      <div className="score-control__label">
        <legend>{label}</legend>
        <strong>{value}/5</strong>
      </div>
      <p>{description}</p>
      <div className="score-control__buttons" role="radiogroup" aria-label={`${label} score`}>
        {[0, 1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={score === value}
            className={score === value ? "is-active" : ""}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
