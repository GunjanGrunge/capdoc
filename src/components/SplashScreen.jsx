import AntIcon from './AntIcon';

export default function SplashScreen({ isFading }) {
  return (
    <div className={`intro-splash ${isFading ? 'fade-out' : ''}`}>
      <div className="intro-logo-wrapper">
        <div className="intro-logo-glow"></div>
        <AntIcon className="intro-ant-svg" />
      </div>
      <div className="intro-text-wrapper">
        <h1 className="intro-title">CapDoc Portal</h1>
        <p className="intro-subtitle">Documentation Hub</p>
      </div>
    </div>
  );
}
