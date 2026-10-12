export function ThemeArt({
  theme,
  mini = false,
}: {
  theme: string;
  mini?: boolean;
}) {
  return (
    <div
      className={`theme-art art-${theme} ${mini ? 'mini' : ''}`}
      aria-hidden="true"
    >
      <div className="art-noise" />
      {theme === 'garden' ? (
        <>
          <div className="moon" />
          <div className="horizon" />
          <div className="flower f1">
            <span>✳</span>
          </div>
          <div className="flower f2">
            <span>✳</span>
          </div>
          <div className="flower f3">
            <span>✳</span>
          </div>
          <div className="flower f4">
            <span>✳</span>
          </div>
          <div className="art-glow" />
          <span className="art-star s1">✧</span>
          <span className="art-star s2">✧</span>
        </>
      ) : theme === 'memory' ? (
        <>
          <div className="paper p1">
            <div className="paper-image hills" />
            <span>our little adventures</span>
          </div>
          <div className="paper p2">
            <div className="paper-image sunset" />
            <span>always, you & me ♡</span>
          </div>
          <span className="tape" />
          <span className="doodle">♡</span>
        </>
      ) : (
        <>
          <div className="planet">
            <span />
          </div>
          <div className="orbit" />
          <span className="big-star">✷</span>
          <span className="art-star s1">✦</span>
          <span className="art-star s2">✧</span>
          <span className="art-star s3">✦</span>
          <div className="tiny-planet" />
        </>
      )}
      <span className="art-caption">
        {theme === 'garden'
          ? 'a little magic, just for you'
          : theme === 'memory'
            ? 'the best memories have you in them'
            : 'you’re my favourite constellation'}
      </span>
    </div>
  );
}
