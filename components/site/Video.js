

export default function Video() {
  return (
    <div className="landing-video-fade w-full max-w-4xl rounded-xl border border-white/80 bg-white/45 p-1.5 pb-0 opacity-70 shadow-[0_18px_50px_rgba(15,118,110,0.16)] backdrop-blur-sm">
      <video
        className="block aspect-video w-full rounded-lg bg-slate-100 object-cover shadow-sm py-3"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src="/videos/jobTrackFast.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};


