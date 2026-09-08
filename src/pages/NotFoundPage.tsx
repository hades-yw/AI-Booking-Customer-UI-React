import { Link } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { PageContainer } from "../components/layout/PageContainer";

export function NotFoundPage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-2xl font-black text-ink-900">Page not found</p>
        <p className="text-sm text-ink-500">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-2 text-sm font-bold text-brand-600 hover:underline">
          Back to Home
        </Link>
      </div>
      <Footer />
    </PageContainer>
  );
}
