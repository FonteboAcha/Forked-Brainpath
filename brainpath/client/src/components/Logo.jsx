export default function Logo({ size = "md", showWordmark = true }) {
  const sizes = {
    sm: { icon: 24, text: "text-sm"  },
    md: { icon: 30, text: "text-base" },
    lg: { icon: 40, text: "text-xl"  },
  };

  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2 select-none">


          <img src="../../icons/logo.png" alt="BrainPath" width={icon} height={icon} />


      {/* <div
        style={{ width: icon, height: icon }}
        className="rounded-lg bg-brand-blue flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <svg
          width={icon * 0.55}
          height={icon * 0.55}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Simple "B" path — swap with your real icon SVG */}

          {/*
          <path
            d="M4 3h5a2.5 2.5 0 0 1 0 5H4V3zm0 5h5.5a2.5 2.5 0 0 1 0 5H4V8z"
            fill="white"
            fillRule="evenodd"
          />
        </svg>
      </div> */}

      {showWordmark && (
        <span className={`${text} font-semibold tracking-tight text-slate-900`}>
          Brain<span className="text-brand-blue">Path</span>
        </span>
      )}
    </div>
  );
}