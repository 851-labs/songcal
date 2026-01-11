import { Link } from "@tanstack/react-router";

interface FooterProps {
  maxWidth?: "3xl" | "7xl";
}

function Footer({ maxWidth = "7xl" }: FooterProps) {
  const maxWidthClass = maxWidth === "3xl" ? "max-w-3xl" : "max-w-7xl";

  return (
    <footer
      className="relative z-10 px-6 md:px-10 py-8 border-t"
      style={{ borderColor: "var(--dark-line)", background: "var(--dark-bg)" }}
    >
      <div className={`${maxWidthClass} mx-auto flex flex-row items-center justify-between gap-4`}>
        <span
          className="text-sm"
          style={{ fontFamily: "Figtree Variable, sans-serif", color: "var(--dark-muted)" }}
        >
          © {new Date().getFullYear()} songcal
        </span>
        <div className="flex items-center gap-6">
          <Link
            to="/privacy"
            className="text-sm transition-opacity hover:opacity-60"
            style={{ fontFamily: "Figtree Variable, sans-serif", color: "var(--dark-muted)" }}
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-sm transition-opacity hover:opacity-60"
            style={{ fontFamily: "Figtree Variable, sans-serif", color: "var(--dark-muted)" }}
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
