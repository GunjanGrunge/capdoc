import AntIcon from './AntIcon';

export default function LoadingScreen({ progressState }) {
  if (!progressState.active) {
    return null;
  }

  return (
    <div className="progress-overlay">
      <div className="progress-card">
        <div className="progress-header">
          <h3 className="progress-title">{progressState.title}</h3>
          <p className="progress-desc">{progressState.desc}</p>
        </div>

        <div className="progress-track-wrapper">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressState.percent}%` }}
            ></div>

            <div
              className={`crawling-ant ${progressState.percent < 100 ? 'crawling' : ''}`}
              style={{ left: `${progressState.percent}%` }}
            >
              <AntIcon />
            </div>

            <div className="progress-finish-line"></div>
          </div>
        </div>

        <div className="progress-percent-label">{progressState.percent}%</div>
      </div>
    </div>
  );
}
