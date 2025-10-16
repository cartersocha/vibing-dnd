import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card">
      <h2>Page Not Found</h2>
      <p>We couldn&apos;t find the page you were looking for.</p>
      <Link href="/" className="btn btn-secondary">
        Return Home
      </Link>
    </div>
  );
}
